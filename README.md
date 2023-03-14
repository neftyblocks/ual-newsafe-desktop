# UAL module for Newsafe desktop wallet

## Installation

```sh
yarn add ual-newsafe-desktop
# or
npm install ual-newsafe-desktop
```

## Usage

### Configuring the authenticator

```ts
import { Newsafe } from "ual-newsafe-cloud";
const newcoin = {
  chainId: "add7deb61981d83563f2c09f266acbfa48153f14453639b4a6259c4c8225d0e7"
  rpcEndpoints: [
    {
      protocol: "https",
      host: "nodeos-dev.newcoin.org",
      port: "443",
    },
  ],
};

const config = {
  appName: "My App",
};

const newsafeCloud = new Newsafe([newcoin], config);

// add to authenticators list, for example:
<UALProvider chains={[newcoin]} authenticators={[newsafeCloud]}>
  <AppWithUAL />
</UALProvider>

```

### Configuring the callback page

As part of the OAuth flow implemented by newsafe cloud wallet, you site will receive the
token to the specified `redirectUrl`, for that we provide a function to handle the response.
You can execute it in the page you specified:

```ts
//    /your/redirect/page
import { handleTokenResponse } from "ual-newsafe-cloud";

handleTokenResponse();
```

The function will fetch the token from the query params, send it to your application's original page and close the current page.

## Development

To run the builder in development mode you can use:

```sh
yarn dev
# or
npm run dev
```

this will rebuild the code anytime a file changes.

### Release

To release you can create a new git tag, this will trigger the publish action in github actions.

Make sure the version in package.json is updated with the new version when creating the tag.
