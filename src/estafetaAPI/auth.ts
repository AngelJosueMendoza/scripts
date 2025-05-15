import axios from "axios";

interface IToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  created_at: number;
}

interface ITypeToken {
  type: 'purchaseOrder' | 'newPickUp' | 'folios' | 'quote' | 'quoteInternacional'
}

let tokensCreateds = new Map<string, IToken>();

const urlEstafetaQA = "https://apiqa.estafeta.com:8443/auth/oauth/v2/token"
const urlEstafetProd = "https://api.estafeta.com/auth/oauth/v2/token"
const urlMicrosoft = "https://login.microsoftonline.com/2a3f6c70-006d-4bba-9bd9-2c200073ca62/oauth2/v2.0/token"
const isProduction = process.env.ISPRODUCTION ?? "false"

export const authToken = async ({ type }: ITypeToken) => await validateToken({type})

interface IKeys {
  [type: string]: {
    clientId: string,
    clientSecret: string,
    url: string,
    scope?: string;
  }
}

const Keys: IKeys = {
  'folios': {
    clientId: process.env.ClientIdFolios ?? "",
    clientSecret: process.env.ClientSecretFolios ?? "",
    url: urlMicrosoft ,
    scope: "https://graph.microsoft.com/.default"
  },
}

const validateToken = async ({type}: ITypeToken)  => {
  const token = tokensCreateds.get(type)
  if (!token) {
    const { clientId, clientSecret, url, scope } = Keys[type]
    const creationToken = await createToken(clientId, clientSecret, url, scope)
    tokensCreateds.set(type, creationToken)
    return creationToken.access_token
  }
  const createdAt = new Date(token.created_at);
  const expiresInMilliseconds = token.expires_in * 1000;
  const expirationDate = new Date(createdAt.getTime() + expiresInMilliseconds);

  const currentDate = new Date();
  if (currentDate >= expirationDate) {
    const { clientId, clientSecret, url, scope } = Keys[type]
    const creationToken = await createToken(clientId, clientSecret, url, scope)
    tokensCreateds.set(type, creationToken)
    return creationToken.access_token
  } else {
    return token.access_token
  }
}

const createToken = async (clientId: string, clientSecret: string, url: string, scope?: string) => {
  try {
    const auth = btoa(`${clientId}:${clientSecret}`)

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: !scope ? "execute" : scope,
    })

    const request = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    })
    const token: IToken = {
      ...request.data,
      created_at: new Date()
    }
    if (!token) return {} as IToken
    return token
  } catch (err: any) {
    console.error("error token", err)
    return {} as IToken
  }
}
