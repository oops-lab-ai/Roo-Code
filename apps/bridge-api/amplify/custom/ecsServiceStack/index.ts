// amplify/custom/ecsServiceStack.ts

import { Construct } from "constructs"
import {
	Stack,
	StackProps,
	aws_ec2 as ec2,
	aws_ecs as ecs,
	aws_ecs_patterns as ecsPatterns,
	aws_ecs as ecsBase,
} from "aws-cdk-lib"
import { aws_ecr as ecr } from "aws-cdk-lib"
import { Duration } from "aws-cdk-lib"
import { aws_cognito as cognito } from "aws-cdk-lib"
import { aws_appsync as appsync } from "aws-cdk-lib"
import { aws_s3 as s3 } from "aws-cdk-lib"
import { CfnOutput } from "aws-cdk-lib"

interface EcsServiceStackProps extends StackProps {
	userPoolId?: string
	appsyncApiUrl?: string
	s3BucketName?: string
}

/**
 * Defines an ECS Fargate service stack with a public-facing load balancer.
 */
export class EcsServiceStack extends Stack {
	constructor(scope: Construct, id: string, props?: EcsServiceStackProps) {
		super(scope, id, props)

		// Create (or import) a VPC. Here, we'll create a new one.
		const vpc = new ec2.Vpc(this, "InterviewGptVpc", {
			maxAzs: 2,
		})

		// Create an ECS cluster in that VPC
		const cluster = new ecs.Cluster(this, "InterviewGptCluster", {
			vpc,
		})

		// Get references to existing resources
		// const userPool = cognito.UserPool.fromUserPoolId(this, 'ExistingUserPool', props?.userPoolId || process.env.USER_POOL_ID || '');

		// const s3Bucket = s3.Bucket.fromBucketName(this, 'ExistingS3Bucket', props?.s3BucketName || process.env.S3_BUCKET || '');

		// Create a Fargate service with environment variables
		const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
			this,
			"InterviewGptFargateService",
			{
				cluster,
				desiredCount: 1,
				publicLoadBalancer: true,
				taskImageOptions: {
					image: ecs.ContainerImage.fromEcrRepository(
						ecr.Repository.fromRepositoryName(this, "MyEcrRepo", "interview-backend"),
						"latest",
					),
					containerPort: 4000,
					environment: {
						USER_POOL_ID: props?.userPoolId || process.env.USER_POOL_ID || "",
						APPSYNC_API_URL: props?.appsyncApiUrl || process.env.APPSYNC_API_URL || "",
						S3_BUCKET: props?.s3BucketName || process.env.S3_BUCKET || "",
						NODE_ENV: process.env.BUILD_ENV || "development",
					},
				},
				runtimePlatform: {
					cpuArchitecture: ecs.CpuArchitecture.X86_64,
					operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
				},
				cpu: 1024,
				memoryLimitMiB: 2048,
				healthCheckGracePeriod: Duration.seconds(60),
			},
		)

		// Configure the target group's health check
		fargateService.targetGroup.configureHealthCheck({
			path: "/health",
			timeout: Duration.seconds(10),
			interval: Duration.seconds(30),
			healthyThresholdCount: 2,
			unhealthyThresholdCount: 3,
		})

		// Output the values for verification
		new CfnOutput(this, "UserPoolId", { value: props?.userPoolId || process.env.USER_POOL_ID || "Not provided" })
		new CfnOutput(this, "AppsyncApiUrl", {
			value: props?.appsyncApiUrl || process.env.APPSYNC_API_URL || "Not provided",
		})
		new CfnOutput(this, "S3BucketName", { value: props?.s3BucketName || process.env.S3_BUCKET || "Not provided" })

		// Optionally output the load balancer endpoint
		this.exportValue(fargateService.loadBalancer.loadBalancerDnsName, {
			name: "InterviewGptLoadBalancerDNS",
		})
	}
}
