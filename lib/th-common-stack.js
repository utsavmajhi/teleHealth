const { Stack, Duration,aws_apigateway } = require('aws-cdk-lib');
// const sqs = require('aws-cdk-lib/aws-sqs');
const cdk = require('aws-cdk-lib');
const { Construct } =require('constructs')
const lambda = require('aws-cdk-lib/aws-lambda')
const { UserPool, UserPoolProps, AccountRecovery } = require('aws-cdk-lib/aws-cognito');

class TeleHealthCommonStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);
    this.layers = [];
    this.userPools = []

    const utilLayer = new lambda.LayerVersion(this,'TeleHealthPackageLayer',{
      code: lambda.Code.fromAsset('TeleHealthLayers/tele-health-packages-layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'TeleHealth Layer for NPM Packages/tools',
      layerName: 'TeleHealthPackageLayer',
      compatibleArchitectures: [lambda.Architecture.X86_64],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Set the removal policy to destroy the layer
    })

    // Create the user pools

    const doctorUserPool = new UserPool(this, 'DoctorUserPool', {
      userPoolName: 'DoctorUserPool',
      accountRecovery: AccountRecovery.EMAIL_ONLY, // Customize as needed
      selfSignUpEnabled: true, // Allow users to sign up
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Set the removal policy to destroy the User Pool
      signInAliases: {
        email: true, // Allow email as a sign-in alias
        username: false, // Disable username sign-in
        phone: false, // Disable phone number sign-in
      },
    });

    const boothUserPool = new UserPool(this, 'BoothUserPool', {
      userPoolName: 'BoothUserPool',
      accountRecovery: AccountRecovery.EMAIL_ONLY, // Customize as needed
      selfSignUpEnabled: true, // Allow users to sign up
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Set the removal policy to destroy the User Pool
      signInAliases: {
        email: true, // Allow email as a sign-in alias
        username: false, // Disable username sign-in
        phone: false, // Disable phone number sign-in
      },
    });

    const supervisorUserPool = new UserPool(this, 'SupervisorUserPool', {
      userPoolName: 'SupervisorUserPool',
      accountRecovery: AccountRecovery.EMAIL_ONLY, // Customize as needed
      selfSignUpEnabled: true, // Allow users to sign up
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Set the removal policy to destroy the User Pool
      signInAliases: {
        email: true, // Allow email as a sign-in alias
        username: false, // Disable username sign-in
        phone: false, // Disable phone number sign-in
      },
    });
    const adminUserPool = new UserPool(this, 'AdminUserPool', {
      userPoolName: 'AdminUserPool',
      accountRecovery: AccountRecovery.EMAIL_ONLY, // Customize as needed
      selfSignUpEnabled: true, // Allow users to sign up
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Set the removal policy to destroy the User Pool
      signInAliases: {
        email: true, // Allow email as a sign-in alias
        username: false, // Disable username sign-in
        phone: false, // Disable phone number sign-in
      },
    });
    // Collate all UserPools into single list to pass it as props
    this.userPools = {...this.userPools, DoctorPool:{ userPoolId :doctorUserPool.userPoolId, arn: doctorUserPool.userPoolArn}, BoothUserPool:{userPoolId: boothUserPool.userPoolId,arn:boothUserPool.userPoolArn},SupervisorUserPool:{userPoolId: supervisorUserPool.userPoolId, arn: supervisorUserPool.userPoolArn},AdminUserPool:{userPoolId: adminUserPool.userPoolId, arn: adminUserPool.userPoolArn}}

    this.api = new aws_apigateway.RestApi(this, props.attributes.apiGatewayName, {
      deployOptions: {
        stageName: props.attributes.stageName,
      },
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: ["*"],
      }
    });

    new cdk.CfnOutput(this, "HTTP API Gateway Export", {
      exportName: `th-api-id`,
      value: this.api.restApiId
    });
    new cdk.CfnOutput(this, `th-api-export`, {
      exportName: `th-api-resource-id`,
      value: this.api.root.resourceId,
    });

    // Updating all the layers into a single List

    this.layers =  [utilLayer]

    // The code that defines your stack goes here
    // example resource
    // const queue = new sqs.Queue(this, 'TeleHealthBeQueue', {
    //   visibilityTimeout: Duration.seconds(300)
    // });
  }
}

module.exports = { TeleHealthCommonStack }
