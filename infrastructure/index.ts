import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { BucketArgs } from "@pulumi/aws/s3";
import { FilesManager, IFile, IFilesManager } from "./utils/FilesManager";

/**
 * Bucket's name
 */
const bucketName = 'mywebsitestatic';

/**
 * Bucket's policy
 * To create a bucket as a static web host, we should set the following policy.
 * The policy grants public access to the files. 
 */
const bucketPolicy: aws.iam.PolicyDocument = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: "Allow-Public-Access-To-Bucket",
      Effect: 'Allow',
      Principal: '*',
      Action: ['s3:GetObject'],
      Resource: `arn:aws:s3:::${bucketName}/*`, // policy refers to bucket name explicitly
    },
  ],
};

/**
 * Bucket's web site configuration
 * Here we set the HTML index file and the HTML error file used if an error occurs.
 */
const website: aws.types.input.s3.BucketWebsite = {
  indexDocument: 'index.html',
  errorDocument: '404.html',
};

/**
 * These are the arguments used to create the bucket.
 * We set how the bucket should be created. With which policy, name, and other configurations.
 * All the options available are documented on Pulumi's website.
 */
const bucketArgs: BucketArgs = {
  bucket: bucketName,
  policy: bucketPolicy,
  website: website,
};

/**
 * Here we create the Bucket.
 */
const webSiteBucket = new aws.s3.Bucket(bucketName, bucketArgs);

/**
 * Gets all the files that will be uploaded to the S3 bucket.
 */
const buildFileManager: IFilesManager = new FilesManager('../source');

/**
 * Builds an S3 Bucket Object from each IFile object.
 * This step will upload the files to the S3 bucket.
 */
buildFileManager.getFiles().forEach((file: IFile): void => {
  const { contentType, filePath, key, fileName } = file;

  new aws.s3.BucketObject(fileName, {
    bucket: webSiteBucket.id,
    source: new pulumi.asset.FileAsset(filePath),
    key,
    contentType: contentType ? contentType : undefined,
  });
});

/**
 * This export will be used as an output in the console.
 * Since the bucket will be created to be used as a static website host, we build the bucket URL.
 * This value will be displayed in the console after the `pulumi up` command finishes.
 */
export const bucketURL = pulumi.interpolate`${bucketName}.${webSiteBucket.websiteDomain}`;
