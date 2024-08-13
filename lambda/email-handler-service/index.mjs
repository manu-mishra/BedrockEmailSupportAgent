import { WorkMailMessageFlowClient, GetRawMessageContentCommand } from "@aws-sdk/client-workmailmessageflow";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { Readable } from 'stream';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { TextDecoder } from 'util';

const workMailClient = new WorkMailMessageFlowClient({ region: process.env.AWS_REGION });
const sesClient = new SESClient({ region: process.env.AWS_REGION });

async function streamToString(stream) {
    const chunks = [];
    const readable = Readable.from(stream);
    for await (const chunk of readable) {
        chunks.push(chunk.toString());
    }
    return chunks.join('');
}

async function invokeBedrockAgent(emailInfo, sessionId) {
    const client = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION });
    const agentId = process.env.AGENT_ID;
    const agentAliasId = process.env.AGENT_ALIAS_ID;

    const command = new InvokeAgentCommand({
        agentId,
        agentAliasId,
        sessionId,
        inputText: JSON.stringify(emailInfo),
    });

    try {
        let completion = "";
        const response = await client.send(command);
        for await (let chunkEvent of response.completion) {
            const chunk = chunkEvent.chunk;
            const decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
            completion += decodedResponse;
        }
        return { sessionId: sessionId, completion };
    } catch (err) {
        console.error('Error invoking Bedrock agent:', err);
        throw err;
    }
}

async function sendResponseEmail(emailResponse, originalEmailInfo) {
    const sourceEmail = process.env.SUPPORT_EMAIL_ADDRESS;
    const destinationEmail = originalEmailInfo.From; // Assuming this is formatted correctly
    
    // Check if 'Re:' is already present in the subject
    const subjectPrefix = originalEmailInfo.Subject.startsWith("Re:") ? "" : "Re: ";
    
    const responseEmail = {
        Source: sourceEmail,
        Destination: {
            ToAddresses: [destinationEmail]
        },
        Message: {
            Subject: {
                Data: `${subjectPrefix}${originalEmailInfo.Subject}`
            },
            Body: {
                Text: {
                    Data: `${emailResponse}\n\n---\nOriginal Message:\nFrom: ${originalEmailInfo.From}\nSubject: ${originalEmailInfo.Subject}\n\n${originalEmailInfo.Body}`
                }
            }
        }
    };

    try {
        const sendCommand = new SendEmailCommand(responseEmail);
        await sesClient.send(sendCommand);
        console.log('Response email sent successfully.');
    } catch (error) {
        console.error('Failed to send response email:', error);
        throw error;
    }
}


export async function handler(event) {
    const msgId = event.messageId;
    console.log(`An Email received with messageId: [${msgId}]`);

    try {
        const rawMsgCommand = new GetRawMessageContentCommand({ messageId: msgId });
        const rawMsgResponse = await workMailClient.send(rawMsgCommand);
        const emailContent = await streamToString(rawMsgResponse.messageContent);

        // Extract email headers and body
        const subjectMatch = emailContent.match(/^Subject: (.*)$/im);
        const fromMatch = emailContent.match(/^From: (.*)$/im);
        const bodyMatch = emailContent.split(/\r?\n\r?\n/).slice(1).join('\n').trim();

        const emailInfo = {
            From: fromMatch ? fromMatch[1] : "Unknown sender",
            Subject: subjectMatch ? subjectMatch[1] : "No subject",
            Body: bodyMatch || "No body content"
        };

        // Invoke the Bedrock agent with the formatted email info
        const bedrockResult = await invokeBedrockAgent(emailInfo, msgId);
        console.log('Bedrock Agent Response:', bedrockResult);

        // Send response email with Bedrock result and original message
        await sendResponseEmail(bedrockResult.completion, emailInfo);
    } catch (error) {
        console.error(`Error processing message: ${error}`);
        throw error;
    }
}
