import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

// TODO: Implement the fileStogare logic
export class AttachmentUtils {

    constructor(private readonly s3 = new XAWS.S3({signatureVersion: 'v4'})) {}

    async getUploadUrl(
        bucket: string, 
        todoId: string, 
        expiration: string
    ) {
        const uploadUrl = this.s3.getSignedUrl('putObject', {
            Bucket: bucket,
            Key: todoId,
            Expires: Number(expiration)
        })
        return uploadUrl
    }
}