import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface BedrockAgentsProps extends cdk.NestedStackProps {
  //knowledgeBase: bedrock.KnowledgeBase;
}

interface BedrockAgentsStackResources {
  //bedrockAgent:  bedrock.Agent;
}

export class BedrockAgentsStack extends cdk.NestedStack {
  public readonly resources: BedrockAgentsStackResources;

  constructor(scope: Construct, id: string, props: BedrockAgentsProps) {
    super(scope, id, props);

    

    // Store the resources in the public property
    this.resources = {
      
    };
  }
}
