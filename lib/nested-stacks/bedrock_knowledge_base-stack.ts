import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { amazonaurora, bedrock } from '@cdklabs/generative-ai-cdk-constructs';

interface BedrockKnowledgeBaseProps extends cdk.NestedStackProps {
  bucket: s3.IBucket;
  kmsKey: kms.Key;
}

interface BedrockKnowledgeBaseResources {
  knowledgeBase: bedrock.KnowledgeBase;
}

export class BedrockKnowledgeBaseStack extends cdk.NestedStack {
  public readonly resources: BedrockKnowledgeBaseResources;

  constructor(scope: Construct, id: string, props: BedrockKnowledgeBaseProps) {
    super(scope, id, props);
    const dimensions = bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024.vectorDimensions;
    if(dimensions)
      {
        const auroraKb =new amazonaurora.AmazonAuroraDefaultVectorStore(this, 'AuroraDefaultVectorStore', {
          embeddingsModelVectorDimension:dimensions
        });
    const kb = new bedrock.KnowledgeBase(this, 'KnowledgeBase', {
      embeddingsModel: bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024,
      vectorStore:auroraKb,
      instruction: 'Use this knowledge base to answer questions about aws bedrock. ' +
        'It contains the full documentation of AWS Bedrock, Agents for bedrock, Bedrock Knowledgebases and generative AI.',
    });

    new bedrock.S3DataSource(this, 'DataSource', {
      bucket: props.bucket,
      knowledgeBase: kb,
      dataSourceName: 'bedrock',
      chunkingStrategy: bedrock.ChunkingStrategy.FIXED_SIZE,
      maxTokens: 500,
      overlapPercentage: 20,
      kmsKey:props.kmsKey,
      inclusionPrefixes:["kb"]
    });
    
      this.resources = {
        knowledgeBase: kb,
      };
    }
    // Store the resources in the public property
    
  }
}
