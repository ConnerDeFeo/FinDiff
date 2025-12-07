import type { ResourcesConfig } from "aws-amplify";

const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_qohaO7d2p',
      userPoolClientId: '723smam9e9jn56op1r7740tbh1',
      loginWith:{
        oauth:{
          domain: 'findiff-auth-domain.auth.us-east-2.amazoncognito.com',
          scopes: ['email', 'openid', 'profile', 'aws.cognito.signin.user.admin'],
          responseType: 'code',
          redirectSignIn: [`${window.location.origin}`],
          redirectSignOut: [`${window.location.origin}`],
        }
      }
    }
  }
}

export default amplifyConfig;