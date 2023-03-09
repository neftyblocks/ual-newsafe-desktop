import {
  SignTransactionResponse,
  User,
  UALErrorType,
} from "universal-authenticator-library";
import {
  APIClient,
  PackedTransaction,
  SignedTransaction,
} from "@greymass/eosio";
import { JsonRpc } from "eosjs";
import { UALAnchorError } from "./UALAnchorError";

export class AnchorUser extends User {
  public client: APIClient;
  public rpc: JsonRpc;
  public session: any;

  public signerKey?: string;
  public signerProof?: string;
  public signerRequest?: any;

  private signatureProvider: any;
  private chainId: string;
  private accountName = "";
  private requestPermission = "";

  constructor(rpc: JsonRpc, client: APIClient, identity: any) {
    super();
    const { session } = identity;
    this.accountName = String(session.auth.actor);
    this.chainId = String(session.chainId);
    if (identity.signatures) {
      [this.signerProof] = identity.signatures;
    }
    if (identity.signerKey) {
      this.signerKey = identity.signerKey;
    }
    if (identity.resolvedTransaction) {
      this.signerRequest = identity.transaction;
    }
    this.requestPermission = String(session.auth.permission);
    this.session = session;
    this.client = client;
    this.rpc = rpc;
  }

  objectify(data: any) {
    return JSON.parse(JSON.stringify(data));
  }

  public async signTransaction(
    transaction: any,
    options: any
  ): Promise<SignTransactionResponse> {
    try {
      let completedTransaction: any;
      // If this is not a transaction and expireSeconds is passed, form a transaction
      //   Note: this needs to be done because the session transact doesn't understand eosjs transact options
      if (options.expireSeconds && !transaction.expiration) {
        const info = await this.client.v1.chain.get_info();
        const tx = {
          ...transaction,
          ...info.getTransactionHeader(options.expireSeconds),
        };
        completedTransaction = await this.session.transact(tx, options);
      } else {
        completedTransaction = await this.session.transact(
          transaction,
          options
        );
      }
      const wasBroadcast = options.broadcast !== false;
      const serializedTransaction = PackedTransaction.fromSigned(
        SignedTransaction.from(completedTransaction.transaction)
      );
      return this.returnEosjsTransaction(wasBroadcast, {
        ...completedTransaction,
        transaction_id: completedTransaction.payload.tx,
        serializedTransaction: serializedTransaction.packed_trx.array,
        signatures: this.objectify(completedTransaction.signatures),
      });
    } catch (e) {
      const message = "Unable to sign transaction";
      const type = UALErrorType.Signing;
      const cause: any = e;
      throw new UALAnchorError(message, type, cause);
    }
  }

  public async signArbitrary(
    publicKey: string,
    data: string,
    _: string
  ): Promise<string> {
    throw new UALAnchorError(
      `Anchor does not currently support signArbitrary(${publicKey}, ${data})`,
      UALErrorType.Unsupported,
      null
    );
  }

  public async verifyKeyOwnership(challenge: string): Promise<boolean> {
    throw new UALAnchorError(
      `Anchor does not currently support verifyKeyOwnership(${challenge})`,
      UALErrorType.Unsupported,
      null
    );
  }

  public async getAccountName() {
    return this.accountName;
  }

  public async getChainId() {
    return this.chainId;
  }

  public async getKeys() {
    try {
      const keys = await this.signatureProvider.getAvailableKeys(
        this.requestPermission
      );
      return keys;
    } catch (error) {
      const message = `Unable to getKeys for account ${this.accountName}.
        Please make sure your wallet is running.`;
      const type = UALErrorType.DataRequest;
      const cause: any = error;
      throw new UALAnchorError(message, type, cause);
    }
  }

  public async isAccountValid() {
    try {
      const account =
        this.client &&
        (await this.client.v1.chain.get_account(this.accountName));
      const actualKeys = this.extractAccountKeys(account);
      const authorizationKeys = await this.getKeys();

      return (
        actualKeys.filter((key) => {
          return authorizationKeys.indexOf(key) !== -1;
        }).length > 0
      );
    } catch (e: any) {
      if (e.constructor.name === "UALAnchorError") {
        throw e;
      }

      const message = `Account validation failed for account ${this.accountName}.`;
      const type = UALErrorType.Validation;
      const cause = e;
      throw new UALAnchorError(message, type, cause);
    }
  }

  public extractAccountKeys(account: any) {
    const keySubsets = account.permissions.map((permission: any) =>
      permission.required_auth.keys.map((key: any) => key.key)
    );
    let keys: any[] = [];
    for (const keySubset of keySubsets) {
      keys = keys.concat(keySubset);
    }
    return keys;
  }
}
