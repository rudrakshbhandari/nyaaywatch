const APP_MONITOR_ID = process.env.AWS_RUM_APP_MONITOR_ID;
const IDENTITY_POOL_ID = process.env.AWS_RUM_IDENTITY_POOL_ID;
const REGION = process.env.AWS_REGION ?? "ap-south-1";

const RUM_CLIENT_VERSION = "1.18.0";
const RUM_CLIENT_SRC = `https://client.rum.us-east-1.amazonaws.com/${RUM_CLIENT_VERSION}/cwr.js`;

/**
 * CloudWatch RUM loader snippet. Emits nothing when the env vars aren't
 * configured (local dev, pre-deploy), so the shell stays clean.
 *
 * allowCookies:false keeps the SDK from writing user-tracking cookies.
 * sessionSampleRate:1 samples every session — fine at current traffic;
 * drop to 0.2 if event volume becomes a billing concern.
 */
export function renderRumSnippet(): string {
  if (!APP_MONITOR_ID || !IDENTITY_POOL_ID) {
    return "";
  }

  const config = {
    sessionSampleRate: 1,
    identityPoolId: IDENTITY_POOL_ID,
    endpoint: `https://dataplane.rum.${REGION}.amazonaws.com`,
    telemetries: ["performance", "errors", "http"],
    allowCookies: false,
    enableXRay: false,
  };

  return `<script>(function(n,i,v,r,s,c,x,z){x=window.AwsRumClient={q:[],n:n,i:i,v:v,r:r,c:c};window[n]=function(c,p){x.q.push({c:c,p:p});};z=document.createElement('script');z.async=true;z.src=s;document.head.insertBefore(z,document.head.getElementsByTagName('script')[0]);})(${JSON.stringify("cwr")},${JSON.stringify(APP_MONITOR_ID)},${JSON.stringify("1.0.0")},${JSON.stringify(REGION)},${JSON.stringify(RUM_CLIENT_SRC)},${JSON.stringify(config)});</script>`;
}
