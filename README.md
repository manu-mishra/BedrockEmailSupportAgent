# Automate Email Responses Using Amazon Bedrock Agents and Knowledge Bases


"Amazon Bedrock is a fully managed service that makes Foundation Models (FMs) from leading AI startups and Amazon available via an API, so you can choose from a wide range of FMs to find the model that is best suited for your use case. With Bedrock's serverless experience, you can get started quickly, privately customize FMs with your own data, and easily integrate and deploy them into your applications using the AWS tools without having to manage any infrastructure."

## Introduction
Email serves as a crucial communication tool for businesses, but traditional processing methods often fall short when handling the volume of incoming messages. This can lead to inefficiencies, delays, and errors, diminishing customer satisfaction.

## Understanding the Challenges
Manual email processing introduces delays and errors, impacting customer satisfaction. Key challenges include the need for ongoing training for support staff, difficulties in managing and retrieving scattered information, and ensuring consistency across different agents' responses.

## The Imperative for AI-Driven Solutions
Businesses are adopting Generative AI to automate and refine email response processes. AI integration accelerates response times and increases the accuracy and relevance of communications, enhancing customer satisfaction.

## Current State of Knowledge Management in Businesses
Organizations possess extensive repositories of digital documents and data that remain underutilized due to their unstructured and dispersed nature. Additionally, while specific APIs and applications exist to handle customer service tasks, they often function in silos and lack integration.

## Characteristics of an Effective AI-Powered Email Agent
A robust AI-driven email support agent must:
1. <strong>Comprehensively Access and Apply Knowledge:</strong> Extract and utilize information from various file formats and data stores across the organization to inform customer interactions.
2. <strong>Seamlessly Integrate with APIs:</strong>  Interact with existing business APIs to execute real-time actions such as transaction processing or customer data updates directly via email.
3. <strong>Incorporate Continuous Awareness:</strong>  Continually integrate new data, such as updated documents or revised policies, allowing the AI to recognize and use the latest information without retraining.
4. <strong>Uphold Security and Compliance Standards:</strong>  Adhere to required data security protocols and compliance mandates specific to the industry to protect sensitive customer information and maintain trust. Implement governance mechanisms to ensure AI-generated responses align with brand standards and regulatory requirements, preventing off-brand communications.

## Solution Overview
This section outlines the architecture designed for an email support system through the use of Generative AI. The diagram provided illustrates the integration of various components crucial for improving the handling of customer emails.

![Solution Overview Diagram](documents/images/solution_overview.png "Solution Overview Diagram")

1. **Email Service**: This component manages all incoming and outgoing customer emails, serving as the primary interface for email communications.
2. **AI Powered Email Processing Engine**: Central to the solution, this engine uses AI to analyze and process emails. It interacts with databases and APIs, extracting necessary information and determining appropriate responses to ensure timely and accurate customer service.
3. **Information Repository**: This repository holds essential documents and data that support customer service processes. The AI engine accesses this resource to pull relevant information needed to effectively address customer inquiries.
4. **Business Applications**: This component executes specific actions identified from email requests, such as processing transactions or updating customer records, enabling prompt and precise fulfillment of customer needs.
5. **Non-Functional Requirements (NFRs)**:
   - **Security**: Protects data and secures processing across all interactions to maintain customer trust.
   - **Monitoring**: Monitors system performance and user activity to ensure operational reliability and efficiency.
   - **Performance**: Ensures high efficiency and speed in email responses to sustain customer satisfaction.
   - **Brand Protection**: Maintains the quality and consistency of customer interactions, protecting the company’s reputation.

## Detailed Implementation Overview
The diagram provides a detailed view of the architecture implemented to enhance email support using Generative AI. This system integrates various AWS services and custom components to automate the processing and handling of customer emails efficiently and effectively.

![Detailed Implementation Diagram](documents/images/detailed_implementation.png "Detailed Implementation Diagram")

1. **Email Service**:
   - **Amazon Workmail**: Manages incoming and outgoing customer emails. When a customer sends an email, Amazon Workmail receives it and triggers the next component in the workflow.
2. **AI Powered Email Processing Engine**:
   - **Email Handler Lambda**: Triggered by Amazon Workmail upon the receipt of an email, acts as the intermediary that receives requests and passes it to the appropriate Agents for Bedrock.
   - **Agents for Amazon Bedrock**: These AI agents process the email content, apply decision-making logic, and draft email responses based on the customer's inquiry and relevant data accessed.
   - **Guardrails for Bedrock**: Ensure that all interactions conform to predefined standards and policies to maintain consistency and accuracy.
3. **Information Repository**:
   - **Knowledge Bases and Open Search**: The system indexes documents and files stored in Amazon S3 using Open Search for quick retrieval. These indexed documents provide a comprehensive base of knowledge that the AI agents consult to inform their responses.
4. **Business Applications**:
   - **Business APIs**: These are invoked by AI agents when specific transactions or updates need to be executed in response to a customer's request. The APIs ensure that all actions taken are appropriate and accurate as per the processed instructions.
5. **Amazon SES**:
   - After the response email is finalized by the AI agents, it is sent to Amazon Simple Email Service (SES) which then dispatches the response back to the customer, completing the interaction loop.

## Deployment Steps

To deploy the Generative AI-based email support system, follow these steps which guide you through setting up the necessary environment and deploying the infrastructure using AWS CDK.

### Prerequisites
Ensure that you have the AWS CLI installed and configured with appropriate permissions. You will also need Node.js and AWS CDK installed on your local machine.

### Installation
Clone the repository and begin by installing the necessary NPM packages. Open your terminal and run the following command:

```bash
npm install
```
This command will install all dependencies defined in your package.json file, preparing your environment for deployment.

### Deploy the CDK project

Bootstrap CDK code to preview the resources that will be created:

```bash
cdk bootstrap
```

Next, synthesize the CloudFormation template from the CDK code to preview the resources that will be created:

```bash
cdk synth
```
This command generates the AWS CloudFormation template for ther application, allowing you to review the infrastructure that will be deployed.

Once you have reviewed the synthesized template and are ready to deploy, execute the following command:

```bash
cdk deploy
```

### Post CDK Deployment Instructions

After deploying the CDK stack, follow these steps to set up and activate the system for processing incoming emails with Generative AI:

#### 1. Configure the Lambda Function for Amazon WorkMail
To ensure that your emails are processed through the Lambda function:

   - Navigate to **WorkMail** in the AWS Management Console.
   - Go to `Organization Settings` and select the `Inbound Rules` tab.
   - Click on `Create rule`.
   - Assign a **Rule Name**.
   - For the action, choose `Run Lambda`, then select `gaesas-stk-email-processor-lambda`  deployed by the CDK stack.
   - Set this Lambda function to trigger upon the receipt of any email by entering `*` in both the *Sender domain* and *Destination domain* fields.

   ![Select Workmail Organization Image](documents/images/select_workmail_organization.png "Select Workmail Organization Image")

   ![Organization Settings Image](documents/images/organization_settings_inbound_rules.png "Organization Settings image")

   ![Create Rule To Trigger Lambda When Email Is Received](documents/images/organization_settings_create_rule.png "Create Rule To Trigger Lambda When Email Is Received")

#### 2. Enable the Support User
Activate the user account set up to receive emails:

   - Click on `Users` in the WorkMail dashboard. You should see a user named `support`.
   - Select this user by checking the box next to the username.
   - Click on `Enable`. A popup window will appear; confirm by clicking `Enable` again in the popup.
   
   ![Find support email account](documents/images/select_disabled_user.png "Find User's email account")

   ![Enable support email account](documents/images/enable_support_mail_box.png "Enable support email account")
   

#### 3. Verify Email Address for Testing
Access the email address configured for testing:

   - Instead of checking the box, click on the username `support` to view detailed user information.
   - Here, you can find the email address associated with this user account, which you can use for further testing and verification processes.

   ![Copy Support Email Address](documents/images/copy_support_email_address.png "Copy Support Email Address")

By following these steps, you'll have the necessary configurations in place to start receiving and processing emails using the Generative AI system powered by AWS services. 


### Clean up resources
Once the testing is complete, you can destroy the resources created by the project by running cdk destroy command:

```bash
cdk destroy
```
## Testing the solution

After the deployment, you should be able to send emails to inquire about the menu items on the "The Regrettable Experience" resturant and make, update or cancel reservations. 


`For production builds, you will either have a verified DOmain in SES or you may utilize another Email sending service. This solution uses SandBox SES and in order to recieve email from ses, you will need to register and verify the email address in SES console. `

In the following image you will notice the bot is capable of asking more information from the user and make reservations. With help of Amazon Guardrails, email's containing profanity were blocked.


## Conclusion
In this post, we have examined how specific Amazon Web Services components are integrated to build a Generative AI-based email support solution. Utilizing Amazon Workmail for handling email traffic, AWS Lambda for processing logic, and Amazon SES for dispatching responses, the system efficiently manages and responds to customer emails. Additionally, Amazon Bedrock agents, supplemented by guardrails and supported by an Open Search-powered Information Repository, ensure that responses are both accurate and compliant with regulatory standards. This cohesive use of AWS services not only streamlines email management but also ensures that each customer interaction is handled with precision, enhancing overall customer satisfaction and operational efficiency.
