import { Authenticator, ButtonStyle, Chain, UALError, UALErrorType, User } from 'universal-authenticator-library';
import AnchorLink from 'anchor-link';
import { JsonRpc } from 'eosjs';
import { APIClient, FetchProvider } from '@greymass/eosio';
import { AnchorUser } from './AnchorUser';
import { UALAnchorError } from './UALAnchorError';
import AnchorLinkBrowserTransport from 'anchor-link-browser-transport';

const AnchorLogo = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGcgdHJhbnNmb3JtPSJtYXRyaXgoMS40NCwgMCwgMCwgMS40NCwgLTguNTAxOTI1LCAtNTcuMDc0NTcpIiBzdHlsZT0iIj4KICAgIDx0aXRsZT5XaGl0ZTwvdGl0bGU+CiAgICA8Y2lyY2xlIGN4PSI5NC43OTMiIGN5PSIxMjguNTI0IiByPSI4MCIgZmlsbD0iI0ZCRkRGRiIvPgogICAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0gOTQuNzk5IDc4LjUyNCBDIDk3LjA5OCA3OC41MjQgOTkuMTk1IDc5LjgzNyAxMDAuMTk4IDgxLjkwNiBMIDEyNC4yMDQgMTMxLjQwNiBMIDEyNC43NDYgMTMyLjUyNCBMIDExMS40MDkgMTMyLjUyNCBMIDEwNy41MyAxMjQuNTI0IEwgODIuMDY5IDEyNC41MjQgTCA3OC4xODkgMTMyLjUyNCBMIDY0Ljg1MyAxMzIuNTI0IEwgNjUuMzk1IDEzMS40MDYgTCA4OS40MDEgODEuOTA2IEMgOTAuNDA0IDc5LjgzNyA5Mi41MDEgNzguNTI0IDk0Ljc5OSA3OC41MjQgWiBNIDg2LjkxOSAxMTQuNTI0IEwgMTAyLjY4IDExNC41MjQgTCA5NC43OTkgOTguMjc0IEwgODYuOTE5IDExNC41MjQgWiBNIDExMi43OTMgMTQ5LjUyNCBMIDEyNC43OTggMTQ5LjUyNCBDIDEyNC40MzcgMTY1LjY3NiAxMTEuMDY3IDE3OC41MjQgOTQuNzk5IDE3OC41MjQgQyA3OC41MzIgMTc4LjUyNCA2NS4xNjIgMTY1LjY3NiA2NC44MDEgMTQ5LjUyNCBMIDc2LjgwNiAxNDkuNTI0IEMgNzcuMDg3IDE1Ni44NzggODEuOTc0IDE2My4xNTUgODguNzkzIDE2NS41MiBMIDg4Ljc5MyAxNDEuNTI0IEMgODguNzkzIDEzOC4yMSA5MS40OCAxMzUuNTI0IDk0Ljc5MyAxMzUuNTI0IEMgOTguMTA3IDEzNS41MjQgMTAwLjc5MyAxMzguMjEgMTAwLjc5MyAxNDEuNTI0IEwgMTAwLjc5MyAxNjUuNTI0IEMgMTA3LjYyIDE2My4xNjIgMTEyLjUxMSAxNTYuODgzIDExMi43OTMgMTQ5LjUyNCBaIiBmaWxsPSIjMzY1MEEyIi8+CiAgPC9nPgo8L3N2Zz4=`;
export const Name = 'Anchor';

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

export class Anchor extends Authenticator {
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
    private service = 'https://cb.anchor.link';
    // the chainId currently in use
    private chainId: string;
    // disable Greymass Fuel cosigning, defaults to false
    private disableGreymassFuel = false;
    // display the request status returned by anchor-link, defaults to false (ual has it's own)
    private requestStatus = false;
    // The referral account used in Fuel transactions
    private fuelReferrer = 'teamgreymass';
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
                'ual-anchor requires the appName property to be set on the `options` argument during initialization.',
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
            const provider = new FetchProvider(`${rpc.protocol}://${rpc.host}:${rpc.port}`);
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
            transport: new AnchorLinkBrowserTransport({
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
        return 'https://github.com/greymass/anchor/';
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
        return 'anchor';
    }

    /**
     * Returns the style of the Button that will be rendered.
     */
    public getStyle(): ButtonStyle {
        return {
            icon: AnchorLogo,
            text: Name,
            textColor: 'white',
            background: '#3650A2',
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
                'UAL-Anchor does not yet support providing multiple chains to UAL. Please initialize the UAL provider with a single chain.',
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
