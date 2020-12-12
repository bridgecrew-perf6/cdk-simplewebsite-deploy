import {
  expect,
  haveResource,
  haveResourceLike,
} from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import {
  CreateBasicSite,
  CreateCloudfrontSite,
} from '../src/cdk-cloudfront-deploy';

describe('Create basic website', () => {
  it('should have a valid basic website', ()=>{
    const stack = new cdk.Stack();
    new CreateBasicSite(stack, 'test-website', {
      websiteFolder: './test/my-website',
      indexDoc: 'index.html',
    });

    expect(stack).to(haveResource('AWS::S3::Bucket', {
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
      },
    }));

    expect(stack).to(haveResource('Custom::CDKBucketDeployment'));

    expect(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Action: 's3:GetObject',
            Effect: 'Allow',
            Principal: '*',
          },
        ],
      },
    }));
  });
  it('should have a valid basic website with error page', ()=>{
    const stack = new cdk.Stack();

    new CreateBasicSite(stack, 'test-website', {
      websiteFolder: './test/my-website',
      indexDoc: 'index.html',
      errorDoc: 'error.html',
    });

    expect(stack).to(haveResource('AWS::S3::Bucket', {
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'error.html',
      },
    }));

    expect(stack).to(haveResource('Custom::CDKBucketDeployment'));

    expect(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Action: 's3:GetObject',
            Effect: 'Allow',
            Principal: '*',
          },
        ],
      },
    }));
  });
  it('should have a valid basic website with encryption', ()=>{
    const stack = new cdk.Stack();
    new CreateBasicSite(stack, 'test-website', {
      websiteFolder: './test/my-website',
      indexDoc: 'index.html',
      encryptBucket: true,
    });

    expect(stack).to(haveResource('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
      },
    }));

    expect(stack).to(haveResource('Custom::CDKBucketDeployment'));

    expect(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Action: 's3:GetObject',
            Effect: 'Allow',
            Principal: '*',
          },
        ],
      },
    }));
  });
  it('should have a valid basic website with custom domain', ()=>{
    const stack = new cdk.Stack();
    new CreateBasicSite(stack, 'test-website', {
      websiteFolder: './test/my-website',
      indexDoc: 'index.html',
      websiteDomain: 'example.com',
    });

    expect(stack).to(haveResource('AWS::S3::Bucket', {
      BucketName: 'example.com',
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
      },
    }));

    expect(stack).to(haveResource('Custom::CDKBucketDeployment'));

    expect(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Action: 's3:GetObject',
            Effect: 'Allow',
            Principal: '*',
          },
        ],
      },
    }));
  });
  it('should have a valid basic website with custom domain and sub-domain', ()=>{
    const stack = new cdk.Stack();
    new CreateBasicSite(stack, 'test-website', {
      websiteFolder: './test/my-website',
      indexDoc: 'index.html',
      websiteDomain: 'example.com',
      websiteSubDomain: 'www.example.com',
    });

    expect(stack).to(haveResource('AWS::S3::Bucket', {
      BucketName: 'example.com',
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
      },
    }));

    expect(stack).to(haveResource('AWS::S3::Bucket', {
      BucketName: 'www.example.com',
      WebsiteConfiguration: {
        RedirectAllRequestsTo: {
          HostName: 'example.com',
          Protocol: 'http',
        },
      },
    }));

    expect(stack).to(haveResource('Custom::CDKBucketDeployment'));

    expect(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Action: 's3:GetObject',
            Effect: 'Allow',
            Principal: '*',
          },
        ],
      },
    }));
  });
});
describe('Create cloudfront website', () => {
  it('should have a valid cloudfront website', ()=>{
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TargetStack', {
      env:
        {
          account: '234567890123',
          region: 'us-east-1',

        },
    });
    new CreateCloudfrontSite(stack, 'test-website', {
      websiteFolder: './test/my-website',
      indexDoc: 'index.html',
      hostedZoneDomain: 'example.com',
      websiteDomain: 'www.example.com',
    });

    expect(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              's3:GetObject*',
              's3:GetBucket*',
              's3:List*',
            ],
            Effect: 'Allow',
          },
        ],
      },
    }));

    expect(stack).to(haveResource('Custom::CDKBucketDeployment'));

    expect(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: [
          'www.example.com',
        ],
        DefaultRootObject: 'index.html',
        Enabled: true,
        HttpVersion: 'http2',
        IPV6Enabled: true,
        Origins: [
          {
            DomainName: {
              'Fn::GetAtt': [
                'WebsiteBucket75C24D94',
                'RegionalDomainName',
              ],
            },
            Id: 'TargetStacktestwebsiteWebsiteDistOrigin17319B9B7',
            S3OriginConfig: {
              OriginAccessIdentity: {
                'Fn::Join': [
                  '',
                  [
                    'origin-access-identity/cloudfront/',
                    {
                      Ref: 'testwebsiteWebsiteDistOrigin1S3Origin1E3934D7',
                    },
                  ],
                ],
              },
            },
          },
        ],
      },
    }));

    expect(stack).to(haveResourceLike('AWS::Route53::RecordSet', {
      Name: 'www.example.com.',
      Type: 'A',
      AliasTarget: {
        DNSName: {},
        HostedZoneId: {},
      },
    }));
  });
  it('should have a valid cloudfront website with encrypted S3 bucket', ()=>{
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TargetStack', {
      env:
        {
          account: '234567890123',
          region: 'us-east-1',

        },
    });
    new CreateCloudfrontSite(stack, 'test-website', {
      websiteFolder: './test/my-website',
      indexDoc: 'index.html',
      hostedZoneDomain: 'example.com',
      websiteDomain: 'www.example.com',
      encryptBucket: true,
    });

    expect(stack).to(haveResource('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
    }));

    expect(stack).to(haveResourceLike('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              's3:GetObject*',
              's3:GetBucket*',
              's3:List*',
            ],
            Effect: 'Allow',
          },
        ],
      },
    }));

    expect(stack).to(haveResource('Custom::CDKBucketDeployment'));

    expect(stack).to(haveResourceLike('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: [
          'www.example.com',
        ],
        DefaultRootObject: 'index.html',
        Enabled: true,
        HttpVersion: 'http2',
        IPV6Enabled: true,
        Origins: [
          {
            DomainName: {
              'Fn::GetAtt': [
                'WebsiteBucket75C24D94',
                'RegionalDomainName',
              ],
            },
            Id: 'TargetStacktestwebsiteWebsiteDistOrigin17319B9B7',
            S3OriginConfig: {
              OriginAccessIdentity: {
                'Fn::Join': [
                  '',
                  [
                    'origin-access-identity/cloudfront/',
                    {
                      Ref: 'testwebsiteWebsiteDistOrigin1S3Origin1E3934D7',
                    },
                  ],
                ],
              },
            },
          },
        ],
      },
    }));
  });
});