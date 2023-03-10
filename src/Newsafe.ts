import {
  Authenticator,
  ButtonStyle,
  Chain,
  UALError,
  UALErrorType,
  User,
} from "universal-authenticator-library";
import AnchorLink from "anchor-link";
import { JsonRpc } from "eosjs";
import { APIClient, FetchProvider } from "@greymass/eosio";
import { AnchorUser } from "./AnchorUser";
import { UALAnchorError } from "./UALAnchorError";
import NewsafeLinkBrowserTransport from "newsafe-link-browser-transport";

const NewsafeLogo =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMjAgMjIwIiB4bWw6c3BhY2U9InByZXNlcnZlIj4KICA8Y2lyY2xlIHN0eWxlPSJzdHJva2U6IzAwMDtzdHJva2Utd2lkdGg6MDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtZGFzaG9mZnNldDowO3N0cm9rZS1saW5lam9pbjptaXRlcjtzdHJva2UtbWl0ZXJsaW1pdDo0O2ZpbGw6IzAwMDtmaWxsLXJ1bGU6bm9uemVybztvcGFjaXR5OjEiIHZlY3Rvci1lZmZlY3Q9Im5vbi1zY2FsaW5nLXN0cm9rZSIgcj0iNDAiIHRyYW5zZm9ybT0ibWF0cml4KDIuNzUgMCAwIDIuNzUgMTEwLjM4IDExMC4zOCkiLz4KICA8Zz4KICAgIDxwYXRoIHN0eWxlPSJzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MTtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtZGFzaG9mZnNldDowO3N0cm9rZS1saW5lam9pbjptaXRlcjtzdHJva2UtbWl0ZXJsaW1pdDo0O2ZpbGw6I2ZmZjtmaWxsLXJ1bGU6bm9uemVybztvcGFjaXR5OjEiIHRyYW5zZm9ybT0ibWF0cml4KDEuMTggMCAwIDEuMTggLjE3IC42NykiIGQ9Im02OC4yMDQgMzYuNjQ4IDcuNzEgMjMuMjMgNC44NTctMi4xNjYtMTIuMTA3LTIxLjI3Ny02LjcyNi0zMC44NzRhOTEuNTMzIDkxLjUzMyAwIDAgMC0xMi4yMDYgNS40NDdsMTguNDcyIDI1LjY0Wk0yMC4xODcgMzUuOTQ0IDQ3LjQ2OCA1MS44NGwxNi40ODcgMTguMDk1IDMuNTQ0LTMuOTM3LTE5LjcyLTE0LjUxOS0xOC42NjgtMjUuNDZhOTEuNjQ3IDkxLjY0NyAwIDAgMC04Ljk0IDkuOTI1aC4wMTZaTTU3LjAzMiA0My4xNmwxMi4zNyAyMS4xMyA0LjI5Ny0zLjExOC0xNi4yNzMtMTguMjkxLTEyLjk3Ny0yOC44MDdhOTIuNTUxIDkyLjU1MSAwIDAgMC0xMC43OTQgNy44NThMNTcuMDMyIDQzLjE2Wk0zMi4xMTQgOTkuNzQybDI0LjQ3Ni0uMTQ4LS41NTgtNS4yODItMjMuOTg0IDQuOTM4TC42NSA5Ni4wODRhOTMuMjY4IDkzLjI2OCAwIDAgMCAxLjM3OCAxMy4yODhsMzAuMDctOS42M2guMDE3Wk0zMi4wNDggODYuODE0bDIzLjk4NCA0LjkzOC41NTgtNS4yODItMjQuNDc2LS4xNDgtMzAuMDg3LTkuNjNBOTMuMDE0IDkzLjAxNCAwIDAgMCAuNjUgODkuOThsMzEuNC0zLjE2NlpNMzQuNjkgNzQuMTY4bDIyLjQyNSA5LjgyNiAxLjY0LTUuMDUyLTIzLjkxOC01LjIzNC0yNy40MjktMTUuN2E5Mi44MDIgOTIuODAyIDAgMCAwLTQuMTM0IDEyLjcxNWwzMS40MTUgMy40NDVaTTgwLjQ3NSAzMi42MTNsMi43MDYgMjQuMzI4IDUuMTg0LTEuMDk5LTcuNDE1LTIzLjMyNy0uMTMtMzEuNThhOTEuMTYgOTEuMTYgMCAwIDAtMTMuMDc2IDIuNzcybDEyLjczIDI4LjkwNlpNMzkuOTA2IDYyLjMzN2wxOS45IDE0LjI3MyAyLjY1Ny00LjU5NC0yMi4zMS0xMC4wODlMMTYuNTc3IDQwLjg4YTkyLjk0OCA5Mi45NDggMCAwIDAtNi42OTMgMTEuNTY1bDMwLjAyMSA5Ljg5MlpNMTMwLjAzNSA4My45NzdsMjIuNDI1LTkuODI3IDMxLjQxNi0zLjQ0NWE5Mi44ODEgOTIuODgxIDAgMCAwLTQuMTM0LTEyLjcxNGwtMjcuNDI5IDE1LjY4My0yMy45MTkgNS4yMzMgMS42NDEgNS4wNTN2LjAxN1pNMTQ2Ljk5NyA2MS45MSAxMjQuNjg2IDcybDIuNjU4IDQuNTkzIDE5Ljg5OS0xNC4yNzMgMzAuMDIxLTkuODkyYTkxLjgyOCA5MS44MjggMCAwIDAtNi42OTMtMTEuNTY1TDE0Ni45OTcgNjEuOTFaTTEyOS43MjIgNDIuODY4bC0xNi4yNzMgMTguMjkxIDQuMjk4IDMuMTE3IDEyLjM2OS0yMS4xMyAyMy4zNzctMjEuMjI3YTkyLjYxNiA5Mi42MTYgMCAwIDAtMTAuNzk0LTcuODU5bC0xMi45NzcgMjguODA4Wk04Ni45MDYuMjk1bDYuNDMgMzAuOTA3LTIuNDEgMjQuMzZoNS4zMTRsLTIuNDExLTI0LjM2TDEwMC4yNi4yOTVhOTAuMTMgOTAuMTMgMCAwIDAtNi42NzctLjI2M2MtMi4yNDggMC00LjQ2Mi4xMTUtNi42NzcuMjYzWk0xMTguNTAyIDM2LjQ1bC0xMi4xMDcgMjEuMjc4IDQuODU2IDIuMTY1IDcuNzEtMjMuMjI5IDE4LjQ3Mi0yNS42NGE5MS41MTcgOTEuNTE3IDAgMCAwLTEyLjIwNS01LjQ0N2wtNi43MSAzMC44OS0uMDE2LS4wMTZaTTEwNi4xOTggMzIuNDk3bC03LjQxNSAyMy4zMjggNS4xODQgMS4wOTkgMi43MDYtMjQuMzI5TDExOS40MDQgMy42OUE5Mi45NDQgOTIuOTQ0IDAgMCAwIDEwNi4zMjkuOTE3bC0uMTMxIDMxLjU4Wk0xNTguMDIyIDI2LjAxOWwtMTguNjY5IDI1LjQ2LTE5LjcxOSAxNC41MTkgMy41NDQgMy45MzcgMTYuNDg2LTE4LjA5NSAyNy4yODItMTUuODk2YTkzLjE5OSA5My4xOTkgMCAwIDAtOC45NDEtOS45MjVoLjAxN1pNMTE4Ljk0NSAxNDkuNDE2bC03LjcxLTIzLjIyOS00Ljg1NiAyLjE2NSAxMi4xMDcgMjEuMjc4IDYuNzEgMzAuODlhOTEuNDA5IDkxLjQwOSAwIDAgMCAxMi4yMDUtNS40NDZsLTE4LjQ3Mi0yNS42NDEuMDE2LS4wMTdaTTEzMC4xMTYgMTQyLjkybC0xMi4zNjktMjEuMTI5LTQuMjk4IDMuMTE2IDE2LjI3MyAxOC4yOTIgMTIuOTc3IDI4LjgwN2E5Mi41NTggOTIuNTU4IDAgMCAwIDEwLjc5NC03Ljg1OGwtMjMuMzc3LTIxLjIyOFpNMTQ3LjI0MyAxMjMuNzQybC0xOS44OTktMTQuMjcyLTIuNjU4IDQuNTkzIDIyLjMxMSAxMC4wODkgMjMuNTc0IDIxLjA0OGE5My4wNDUgOTMuMDQ1IDAgMCAwIDYuNjkzLTExLjU2NmwtMzAuMDIxLTkuODkyWk0xNjYuOTYyIDE1MC4xMzhsLTI3LjI4MS0xNS44OTYtMTYuNDg3LTE4LjA5NS0zLjU0NCAzLjkzNyAxOS43MTkgMTQuNTE5IDE4LjY2OSAyNS40NmE5MS42MDEgOTEuNjAxIDAgMCAwIDguOTQtOS45MjVoLS4wMTZaTTE1NS4wMzUgODYuMzIybC0yNC40NzYuMTQ4LjU1OCA1LjI4MiAyMy45ODQtNC45MzhMMTg2LjUgODkuOThhOTMuMzE3IDkzLjMxNyAwIDAgMC0xLjM3OC0xMy4yODhsLTMwLjA3MSA5LjYzaC0uMDE2Wk0xNTUuMTAxIDk5LjI1bC0yMy45ODQtNC45MzgtLjU1OCA1LjI4MiAyNC40NzYuMTQ4IDMwLjA3IDkuNjNhOTIuOTI0IDkyLjkyNCAwIDAgMCAxLjM3OC0xMy4yODhsLTMxLjM5OSAzLjE2NmguMDE3Wk0xNTIuNDYgMTExLjkxNGwtMjIuNDI1LTkuODI2LTEuNjQxIDUuMDUzIDIzLjkxOSA1LjIzMyAyNy40MjkgMTUuNjgzYTkyLjg2MiA5Mi44NjIgMCAwIDAgNC4xMzQtMTIuNzE0bC0zMS40MTYtMy40NDV2LjAxNlpNMTAwLjI2IDE4NS43NjlsLTYuNDMxLTMwLjkwNyAyLjQxMS0yNC4zNjFoLTUuMzE1bDIuNDEyIDI0LjM2MS02LjQzMSAzMC45MDdhOTAuMTQgOTAuMTQgMCAwIDAgNi42NzcuMjYzYzIuMjQ3IDAgNC40NjItLjExNSA2LjY3Ny0uMjYzWk0xMDYuNjczIDE1My40NjZsLTIuNzA2LTI0LjMyOC01LjE4NCAxLjA5OSA3LjQxNSAyMy4zMjguMTMxIDMxLjU3OWE5MS4yMjIgOTEuMjIyIDAgMCAwIDEzLjA3NS0yLjc3MmwtMTIuNzMxLTI4LjkwNlpNNTcuNDI2IDE0My4xOTlsMTYuMjczLTE4LjI5Mi00LjI5OC0zLjExNi0xMi4zNjkgMjEuMTI5LTIzLjM3NyAyMS4yMjhhOTIuNTA1IDkyLjUwNSAwIDAgMCAxMC43OTQgNy44NThsMTIuOTc3LTI4LjgwN1pNNDAuMTUyIDEyNC4xNjhsMjIuMzExLTEwLjA4OS0yLjY1Ny00LjU5NC0xOS45IDE0LjI3My0zMC4wMiA5Ljg5MmE5MS43NjIgOTEuNzYyIDAgMCAwIDYuNjkyIDExLjU2NWwyMy41NzQtMjEuMDQ3Wk0yOS4xMjggMTYwLjA0N2wxOC42NjktMjUuNDYgMTkuNzE4LTE0LjUxOC0zLjU0My0zLjkzOC0xNi40ODcgMTguMDk1LTI3LjI2NSAxNS44OTZhOTMuMTU5IDkzLjE1OSAwIDAgMCA4Ljk0IDkuOTI1aC0uMDMyWk02OC42NDcgMTQ5LjYzbDEyLjEwNy0yMS4yNzgtNC44NTYtMi4xNjUtNy43MSAyMy4yMjktMTguNDU2IDI1LjY0MWE5MS41NjIgOTEuNTYyIDAgMCAwIDEyLjIwNiA1LjQ0N2w2LjcxLTMwLjg5MXYuMDE3Wk0zNC44MzcgMTEyLjM3NGwyMy45MTgtNS4yMzMtMS42NC01LjA1My0yMi40MjYgOS44MjYtMzEuNDE1IDMuNDQ1YTkyLjc4MiA5Mi43ODIgMCAwIDAgNC4xMzQgMTIuNzE0bDI3LjQyOS0xNS42ODN2LS4wMTZaTTgwLjk2OCAxNTMuNTY1bDcuNDE1LTIzLjMyOC01LjE4NC0xLjA5OS0yLjcwNyAyNC4zMjgtMTIuNzMgMjguOTA2YTkyLjk0NiA5Mi45NDYgMCAwIDAgMTMuMDc1IDIuNzcybC4xMy0zMS41NzlaIi8+CiAgPC9nPgo8L3N2Zz4=";
export const Name = "Newsafe Desktop";

export interface UALAnchorOptions {
  // The app name, required by anchor-link. Short string identifying the app
  appName: string;
  // A APIClient object from @greymass/eosio. If not specified, it'll be created using the JsonRpc endpoint
  client?: APIClient;
  // Either a JsonRpc instance from eosjs or the url for an API to connect a new JsonRpc instance to
  rpc?: JsonRpc;
  // The callback service URL to use, defaults to https://cb.anchor.link
  service?: string;
  // A flag to disable the Greymass Fuel integration, defaults to false (enabled)
  disableGreymassFuel?: boolean;
  // A flag to enable the Anchor Link UI request status, defaults to false (disabled)
  requestStatus?: boolean;
  // An account name to use as the referral account for Fuel
  fuelReferrer?: string;
  // Whether anchor-link should be configured to verify identity proofs in the browser for the app
  verifyProofs?: boolean;
}

export class Newsafe extends Authenticator {
  // a JsonRpc instance that can be utilized
  public rpc: JsonRpc;
  // a APIClient instance that can be utilized
  public client: APIClient;
  // Storage for AnchorUser instances
  private users: AnchorUser[] = [];
  // The app name, required by anchor-link
  private appName: string;
  // storage for the anchor-link instance
  private link?: any;
  // the callback service url, defaults to https://cb.anchor.link
  private service = "https://cb.anchor.link";
  // the chainId currently in use
  private chainId: string;
  // disable Greymass Fuel cosigning, defaults to false
  private disableGreymassFuel = false;
  // display the request status returned by anchor-link, defaults to false (ual has it's own)
  private requestStatus = false;
  // The referral account used in Fuel transactions
  private fuelReferrer = "teamgreymass";
  // Whether anchor-link should be configured to verify identity proofs in the browser for the app
  private verifyProofs = false;
  // Whether the init has fiished loading
  private isInitFinished = false;

  /**
   * Anchor Constructor.
   *
   * @param chains
   * @param options { appName } appName is a required option to use Scatter
   */
  constructor(chains: Chain[], options?: UALAnchorOptions) {
    super(chains);
    // Establish initial values
    this.chainId = chains[0].chainId;
    this.users = [];
    // Determine the default rpc endpoint for this chain
    const [chain] = chains;
    const [rpc] = chain.rpcEndpoints;
    // Ensure the appName is set properly
    if (options && options.appName) {
      this.appName = options.appName;
    } else {
      throw new UALAnchorError(
        "ual-anchor requires the appName property to be set on the `options` argument during initialization.",
        UALErrorType.Initialization,
        null
      );
    }
    // Allow overriding the JsonRpc client via options
    if (options && options.rpc) {
      this.rpc = options.rpc;
    } else {
      // otherwise just return a generic rpc instance for this endpoint
      this.rpc = new JsonRpc(`${rpc.protocol}://${rpc.host}:${rpc.port}`);
    }
    // Allow overriding the APIClient via options
    if (options && options.client) {
      this.client = options.client;
    } else {
      const provider = new FetchProvider(
        `${rpc.protocol}://${rpc.host}:${rpc.port}`
      );
      this.client = new APIClient({ provider });
    }
    // Allow passing a custom service URL to process callbacks
    if (options.service) {
      this.service = options.service;
    }
    // Allow passing of disable flag for Greymass Fuel
    if (options && options.disableGreymassFuel) {
      this.disableGreymassFuel = options.disableGreymassFuel;
    }
    // Allow passing of disable flag for resulting request status
    if (options && options.requestStatus) {
      this.requestStatus = options.requestStatus;
    }
    // Allow specifying a Fuel referral account
    if (options && options.fuelReferrer) {
      this.fuelReferrer = options.fuelReferrer;
    }
    // Allow overriding the proof verification option
    if (options && options.verifyProofs) {
      this.verifyProofs = options.verifyProofs;
    }
  }

  /**
   * Called after `shouldRender` and should be used to handle any async actions required to initialize the authenticator
   */
  public async init() {
    this.isInitFinished = false;
    // establish anchor-link
    this.link = new AnchorLink({
      chains: [
        {
          chainId: this.chainId,
          nodeUrl: this.client as any,
        },
      ],
      service: this.service,
      transport: new NewsafeLinkBrowserTransport({
        requestStatus: this.requestStatus,
        disableGreymassFuel: this.disableGreymassFuel,
        fuelReferrer: this.fuelReferrer,
      }),
      verifyProofs: this.verifyProofs,
    });
    // attempt to restore any existing session for this app
    const session = await this.link.restoreSession(this.appName);
    if (session) {
      this.users = [new AnchorUser(this.rpc, this.client, { session })];
    }
    this.isInitFinished = true;
  }

  /**
   * Resets the authenticator to its initial, default state then calls `init` method
   */
  public reset() {
    this.users = [];
  }

  /**
   * Returns true if the authenticator has errored while initializing.
   */
  public isErrored() {
    return false;
  }

  /**
   * Returns a URL where the user can download and install the underlying authenticator
   * if it is not found by the UAL Authenticator.
   */
  public getOnboardingLink(): string {
    return "https://github.com/greymass/anchor/";
  }

  /**
   * Returns error (if available) if the authenticator has errored while initializing.
   */
  public getError(): UALError | null {
    return null;
  }

  /**
   * Returns true if the authenticator is loading while initializing its internal state.
   */
  public isLoading() {
    return !this.isInitFinished;
  }

  public getName() {
    return "anchor";
  }

  /**
   * Returns the style of the Button that will be rendered.
   */
  public getStyle(): ButtonStyle {
    return {
      icon: NewsafeLogo,
      text: Name,
      textColor: "black",
      background: "#ffffff",
    };
  }

  /**
   * Returns whether or not the button should render based on the operating environment and other factors.
   * ie. If your Authenticator App does not support mobile, it returns false when running in a mobile browser.
   */
  public shouldRender() {
    return true;
  }

  /**
   * Returns whether or not the dapp should attempt to auto login with the Authenticator app.
   * Auto login will only occur when there is only one Authenticator that returns shouldRender() true and
   * shouldAutoLogin() true.
   */
  public shouldAutoLogin() {
    return this.users.length > 0;
  }

  /**
   * Returns whether or not the button should show an account name input field.
   * This is for Authenticators that do not have a concept of account names.
   */
  public async shouldRequestAccountName(): Promise<boolean> {
    return false;
  }

  /**
   * Login using the Authenticator App. This can return one or more users depending on multiple chain support.
   *
   * @param accountName  The account name of the user for Authenticators that do not store accounts (optional)
   */
  public async login(): Promise<User[]> {
    if (this.chains.length > 1) {
      throw new UALAnchorError(
        "UAL-Anchor does not yet support providing multiple chains to UAL. Please initialize the UAL provider with a single chain.",
        UALErrorType.Unsupported,
        null
      );
    }
    try {
      // only call the login method if no users exist, to prevent UI from prompting for login during auto login
      //  some changes to UAL are going to be required to support multiple users
      if (this.users.length === 0) {
        const identity = await this.link.login(this.appName);
        this.users = [new AnchorUser(this.rpc, this.client, identity)];
      }
    } catch (e: any) {
      throw new UALAnchorError(e.message, UALErrorType.Login, e);
    }
    return this.users;
  }

  /**
   * Logs the user out of the dapp. This will be strongly dependent on each Authenticator app's patterns.
   */
  public async logout(): Promise<void> {
    // Ensure a user exists to logout
    if (this.users.length) {
      // retrieve the current user
      const [user] = this.users;
      // retrieve the auth from the current user
      const {
        session: { auth },
      } = user;
      // remove the session from anchor-link
      await this.link.removeSession(this.appName, auth, this.chainId);
    }
    // reset the authenticator
    this.reset();
  }

  /**
   * Returns true if user confirmation is required for `getKeys`
   */
  public requiresGetKeyConfirmation(): boolean {
    return false;
  }
}
