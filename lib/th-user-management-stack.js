const { Stack, Duration,aws_apigateway } = require('aws-cdk-lib');
// const sqs = require('aws-cdk-lib/aws-sqs');
const cdk = require('aws-cdk-lib');
const { Construct } =require('constructs')
const lambda = require('aws-cdk-lib/aws-lambda')
const { PolicyStatement, Effect } = require('aws-cdk-lib/aws-iam');

class TeleUserManagementStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);
    this.layers = [];

    console.log("userManagementStack Created")

    const api = aws_apigateway.RestApi.fromRestApiAttributes(this, props.attributes.apiGatewayName, {
      restApiId: cdk.Fn.importValue(`th-api-id`),
      rootResourceId: cdk.Fn.importValue(`th-api-resource-id`),
    });

    const createDoctorUserHandler = new lambda.Function(this, 'TeleHealthCreateDoctorUserLambda', {
          runtime: lambda.Runtime.NODEJS_18_X,
          code: lambda.Code.fromAsset('user-management/createDoctorUser'),
          handler: 'createDoctorUserLambda.handler',
          layers: props.layers,
          timeout: cdk.Duration.seconds(300),
          functionName: "TeleHealthCreateDoctorUserLambda",
          environment: {
            DOCTORUSERPOOLID: `${props.userPools.DoctorPool.userPoolId}`,
              DOCTORUSERPOOLARN: `${props.userPools.DoctorPool.arn}`,
            REGION: `${this.region}`
          }
    });

      const createBoothHandler = new lambda.Function(this, 'TeleHealthCreateBoothLambda', {
          runtime: lambda.Runtime.NODEJS_18_X,
          code: lambda.Code.fromAsset('user-management/createBooth'),
          handler: 'createBoothLambda.handler',
          layers: props.layers,
          timeout: cdk.Duration.seconds(300),
          functionName: "TeleHealthCreateBoothLambda",
          environment: {
              BOOTHPOOLID: `${props.userPools.BoothUserPool.userPoolId}`,
              BOOTHPOOLARN: `${props.userPools.BoothUserPool.arn}`,
              ADMINPOOLID:`${props.userPools.AdminUserPool.userPoolId}`,
              ADMINPOOLARN: `${props.userPools.AdminUserPool.arn}`,
              REGION: `${this.region}`
          }
      });


      const createSupervisorHandler = new lambda.Function(this, 'TeleHealthCreateSupervisorLambda', {
          runtime: lambda.Runtime.NODEJS_18_X,
          code: lambda.Code.fromAsset('user-management/createSupervisorUser'),
          handler: 'createSupervisorUserLambda.handler',
          layers: props.layers,
          timeout: cdk.Duration.seconds(300),
          functionName: "TeleHealthCreateSupervisorLambda",
          environment: {
              SUPERVISORPOOLID: `${props.userPools.SupervisorUserPool.userPoolId}`,
              SUPERVISORARN: `${props.userPools.SupervisorUserPool.arn}`,
              ADMINPOOLID:`${props.userPools.AdminUserPool.userPoolId}`,
              ADMINPOOLARN: `${props.userPools.AdminUserPool.arn}`,
              REGION: `${this.region}`
          }
      });

      const createAdminUserHandler = new lambda.Function(this, 'TeleHealthCreateAdminUserLambda', {
          runtime: lambda.Runtime.NODEJS_18_X,
          code: lambda.Code.fromAsset('user-management/createAdminUser'),
          handler: 'createAdminUser.handler',
          layers: props.layers,
          timeout: cdk.Duration.seconds(300),
          functionName: "TeleHealthCreateAdminUserLambda",
          environment: {
              ADMINPOOLID:`${props.userPools.AdminUserPool.userPoolId}`,
              ADMINPOOLARN: `${props.userPools.AdminUserPool.arn}`,
              REGION: `${this.region}`
          }
      });
      const boothReviewHandler = new lambda.Function(this, 'TeleHealthBoothReviewLambda', {
          runtime: lambda.Runtime.NODEJS_18_X,
          code: lambda.Code.fromAsset('user-management/boothReview'),
          handler: 'boothReview.handler',
          layers: props.layers,
          timeout: cdk.Duration.seconds(300),
          functionName: "TeleHealthBoothReviewLambda",
          environment: {
              REGION: `${this.region}`
          }
      });

      const doctorReviewHandler = new lambda.Function(this, 'TeleHealthDoctorReviewLambda', {
          runtime: lambda.Runtime.NODEJS_18_X,
          code: lambda.Code.fromAsset('user-management/doctorReview'),
          handler: 'doctorReview.handler',
          layers: props.layers,
          timeout: cdk.Duration.seconds(300),
          functionName: "TeleHealthDoctorReviewLambda",
          environment: {
              REGION: `${this.region}`
          }
      });

      const assignDoctorToBoothHandler = new lambda.Function(this, 'TeleHealthAssignDoctorToBoothLambda', {
          runtime: lambda.Runtime.NODEJS_18_X,
          code: lambda.Code.fromAsset('user-management/assignDoctorToBooth'),
          handler: 'assignDoctorToBooth.handler',
          layers: props.layers,
          timeout: cdk.Duration.seconds(300),
          functionName: "TeleHealthAssignDoctorToBoothLambda",
          environment: {
              REGION: `${this.region}`
          }
      });
    // Cognito IAM Policies added to Lambda
      createDoctorUserHandler.addToRolePolicy(
          new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['cognito-idp:AdminCreateUser','cognito-idp:AdminUpdateUserAttributes','cognito-idp:AdminEnableUser','cognito-idp:AdminDisableUser','cognito-idp:AdminGetUser'],
              resources: [`${props.userPools.DoctorPool.arn}`],
          })
      );

      createBoothHandler.addToRolePolicy(
          new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['cognito-idp:AdminCreateUser','cognito-idp:AdminUpdateUserAttributes','cognito-idp:AdminEnableUser','cognito-idp:AdminDisableUser','cognito-idp:AdminGetUser'],
              resources: [`${props.userPools.BoothUserPool.arn}`,`${props.userPools.AdminUserPool.arn}`],
          })
      );

      createSupervisorHandler.addToRolePolicy(
          new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['cognito-idp:AdminCreateUser','cognito-idp:AdminUpdateUserAttributes','cognito-idp:AdminEnableUser','cognito-idp:AdminDisableUser','cognito-idp:AdminGetUser'],
              resources: [`${props.userPools.SupervisorUserPool.arn}`,`${props.userPools.AdminUserPool.arn}`],
          })
      );

      createAdminUserHandler.addToRolePolicy(
          new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['cognito-idp:AdminCreateUser','cognito-idp:AdminUpdateUserAttributes','cognito-idp:AdminEnableUser','cognito-idp:AdminDisableUser','cognito-idp:AdminGetUser'],
              resources: [`${props.userPools.AdminUserPool.arn}`],
          })
      );

      api.root
        .resourceForPath("/doctor/signup")
        .addMethod("POST", new aws_apigateway.LambdaIntegration(createDoctorUserHandler));

      api.root
          .resourceForPath("/booth/signup")
          .addMethod("POST", new aws_apigateway.LambdaIntegration(createBoothHandler));

      api.root
          .resourceForPath("/supervisor/signup")
          .addMethod("POST", new aws_apigateway.LambdaIntegration(createSupervisorHandler));

      api.root
          .resourceForPath("/admin/signup")
          .addMethod("POST", new aws_apigateway.LambdaIntegration(createAdminUserHandler));

      api.root
          .resourceForPath("/booth/review")
          .addMethod("POST", new aws_apigateway.LambdaIntegration(boothReviewHandler));

      api.root
          .resourceForPath("/doctor/review")
          .addMethod("POST", new aws_apigateway.LambdaIntegration(doctorReviewHandler));

      api.root
          .resourceForPath("/booth/assign-doctor")
          .addMethod("POST", new aws_apigateway.LambdaIntegration(assignDoctorToBoothHandler));
  }
}

module.exports = { TeleUserManagementStack }
