import { CfnOutput, Duration, Fn, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';

export interface IdmDnsStackProps extends StackProps {
  domainName: string;
}

export class IdmDnsStack extends Stack {
  public readonly hostedZone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: IdmDnsStackProps) {
    super(scope, id, props);

    // The domain is registered at GoDaddy. Its nameservers there must be set to this zone's NameServers output,
    // otherwise nothing in here (or the website's certificate validation) is visible to the internet.
    const zone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: props.domainName,
      comment: 'IDM Internacional website',
    });
    // A recreated zone gets new nameservers, which would mean updating the registrar again.
    zone.applyRemovalPolicy(RemovalPolicy.RETAIN);

    // Carried over from the GoDaddy zone. The website records live in the website stack.
    new route53.TxtRecord(this, 'Dmarc', {
      zone,
      recordName: '_dmarc',
      values: ['v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;'],
      ttl: Duration.hours(1),
    });

    this.hostedZone = zone;

    new CfnOutput(this, 'HostedZoneId', { value: zone.hostedZoneId });
    new CfnOutput(this, 'NameServers', { value: Fn.join(', ', zone.hostedZoneNameServers!) });
  }
}
