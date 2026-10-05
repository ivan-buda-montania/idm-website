import * as fs from 'node:fs';
import * as path from 'node:path';
import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

// Vite build output of the site (`npm run build` in the repo root).
const SITE_DIR = path.join(__dirname, '..', '..', 'dist');

export interface IdmWebsiteStackProps extends StackProps {
  // The site is served at the zone's apex, with www redirecting to it.
  hostedZone: route53.IHostedZone;
}

export class IdmWebsiteStack extends Stack {
  constructor(scope: Construct, id: string, props: IdmWebsiteStackProps) {
    super(scope, id, props);

    const { hostedZone } = props;
    const domainName = hostedZone.zoneName;
    const wwwDomainName = `www.${domainName}`;

    if (!fs.existsSync(path.join(SITE_DIR, 'index.html'))) {
      throw new Error(`No site build found in ${SITE_DIR}. Run \`npm run build\` in the repo root first.`);
    }

    // Private bucket; only CloudFront can read it (origin access control).
    const bucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Validated through the hosted zone, so it only issues once the registrar delegates the domain to Route 53.
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName,
      subjectAlternativeNames: [wwwDomainName],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Requests for www are redirected to the apex domain, keeping the path and query string.
    // The app uses BrowserRouter, so routes like /machinery and /products have no file in the bucket.
    // Any path whose last segment has no file extension is served index.html.
    const spaRewrite = new cloudfront.Function(this, 'SpaRewrite', {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      comment: 'Redirect www to the apex domain and serve index.html for client-side routes',
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  if (request.headers.host && request.headers.host.value === '${wwwDomainName}') {
    var qs = [];
    for (var key in request.querystring) {
      var param = request.querystring[key];
      (param.multiValue || [param]).forEach(function (p) { qs.push(key + '=' + p.value); });
    }
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: 'https://${domainName}' + request.uri + (qs.length ? '?' + qs.join('&') : '') } },
    };
  }
  var last = request.uri.split('/').pop();
  if (last.indexOf('.') === -1) {
    request.uri = '/index.html';
  }
  return request;
}`),
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: 'IDM Internacional website',
      domainNames: [domainName, wwwDomainName],
      certificate,
      defaultRootObject: 'index.html',
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      // South American edge locations (Brazil, Chile, Colombia) are only included in the "All" price class.
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        compress: true,
        functionAssociations: [{ function: spaRewrite, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST }],
      },
      // Without ListBucket, S3 answers missing files with 403; report them as 404.
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 404, responsePagePath: '/index.html', ttl: Duration.minutes(1) },
      ],
    });

    // Everything but index.html. Vite hashes its bundles, but files copied from public/ (logos, wallpapers,
    // catalog.json, media) keep their names, so they get a short cache instead of an immutable one.
    const assets = new s3deploy.BucketDeployment(this, 'DeployAssets', {
      sources: [s3deploy.Source.asset(SITE_DIR)],
      destinationBucket: bucket,
      exclude: ['index.html'],
      cacheControl: [s3deploy.CacheControl.setPublic(), s3deploy.CacheControl.maxAge(Duration.hours(1))],
      memoryLimit: 512,
    });

    // index.html goes last, once the bundles it references are in place, and is always revalidated.
    const page = new s3deploy.BucketDeployment(this, 'DeployIndex', {
      sources: [s3deploy.Source.asset(SITE_DIR)],
      destinationBucket: bucket,
      exclude: ['*'],
      include: ['index.html'],
      prune: false,
      cacheControl: [s3deploy.CacheControl.noCache()],
      memoryLimit: 512,
      distribution,
      distributionPaths: ['/*'],
    });
    page.node.addDependency(assets);

    const aliasTarget = route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution));
    for (const [id, recordName] of [['Apex', domainName], ['Www', wwwDomainName]]) {
      new route53.ARecord(this, `${id}A`, { zone: hostedZone, recordName, target: aliasTarget });
      new route53.AaaaRecord(this, `${id}Aaaa`, { zone: hostedZone, recordName, target: aliasTarget });
    }

    new CfnOutput(this, 'SiteUrl', { value: `https://${domainName}` });
    new CfnOutput(this, 'CloudFrontUrl', { value: `https://${distribution.distributionDomainName}` });
    new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
    new CfnOutput(this, 'BucketName', { value: bucket.bucketName });
  }
}
