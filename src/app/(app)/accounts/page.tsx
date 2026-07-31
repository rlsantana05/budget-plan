import { getAccounts } from "@/actions/accounts";
import AccountsClient from "./_components/AccountsClient";

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return <AccountsClient initialAccounts={accounts} />;
}
