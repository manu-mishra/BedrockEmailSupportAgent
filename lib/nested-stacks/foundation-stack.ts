import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { Construct } from 'constructs';

interface FoundationStackResources {
  nodeJsLambdaLayer: lambda.LayerVersion;
}

export class FoundationStack extends cdk.NestedStack {
  public readonly resources: FoundationStackResources;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const nodeJsLambdaLayer = new lambda.LayerVersion(this, 'NodeJsLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../assets/lambda/lambda-layer/nodejs')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'A layer with some packages installed',
    });

    this.resources = {
      nodeJsLambdaLayer: nodeJsLambdaLayer
    };
  }
}
