type DefaultParams = {
  endpointUrl: string;
  auth: {
    accessKeyId: string;
    secretAccessKey: string;
  },
  region: string;
  httpOptions: {
    timeout: number;
    connectTimeout: number;
  },
  Bucket: string;
  debug: boolean;
}

type DefaultIgnoreList = string[];

export { DefaultParams, DefaultIgnoreList };