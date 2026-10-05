#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';
import { IdmDnsStack } from '../lib/idm-dns-stack';
import { IdmWebsiteStack } from '../lib/idm-website-stack';

const app = new App();

// us-east-1 is required for the CloudFront certificate.
const env = { account: '508587295478', region: 'us-east-1' };

const dns = new IdmDnsStack(app, 'IdmDnsProd', {
  env,
  description: 'IDM Internacional website - Route 53 hosted zone for idminternacional.com (prod)',
  terminationProtection: true,
  domainName: 'idminternacional.com',
});

new IdmWebsiteStack(app, 'IdmWebsiteProd', {
  env,
  description: 'IDM Internacional website - S3 and CloudFront (prod)',
  terminationProtection: true,
  hostedZone: dns.hostedZone,
});

Tags.of(app).add('project', 'idm-website');
Tags.of(app).add('environment', 'prod');
