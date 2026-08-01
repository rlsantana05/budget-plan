import { getAccountTotal } from "@/actions/accounts";
import DashboardClient from "./_components/DashboardClient";

export default async function Dashboard() {
  const accountTotal = await getAccountTotal();

  return <DashboardClient accountTotal={accountTotal} />;
}
