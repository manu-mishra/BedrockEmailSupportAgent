import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { bedrock } from '@cdklabs/generative-ai-cdk-constructs';

interface BedrockAgentsProps extends cdk.NestedStackProps {
  knowledgeBase: bedrock.KnowledgeBase;
}

interface BedrockAgentsStackResources {
  bedrockAgent:  bedrock.Agent;
}

export class BedrockAgentsStack extends cdk.NestedStack {
  public readonly resources: BedrockAgentsStackResources;

  constructor(scope: Construct, id: string, props: BedrockAgentsProps) {
    super(scope, id, props);

    const { knowledgeBase } = props;

    const agent = new bedrock.Agent(this, 'Agent', {
      foundationModel: bedrock.BedrockFoundationModel.ANTHROPIC_CLAUDE_SONNET_V1_0,
      instruction: 'You are a helpful and friendly agent that answers questions about literature.',
      
    });

   agent.addKnowledgeBase(knowledgeBase);

    // Store the resources in the public property
    this.resources = {
      bedrockAgent: agent,
    };
  }
}
