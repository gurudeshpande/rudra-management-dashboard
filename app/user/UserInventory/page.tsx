// app/user/UserInventory/page.tsx
import UserInventory from "@/components/userinventory/UserInventory";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UserInventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return <UserInventory themeColor="#954C2E" themeLight="#F5E9E4" />;
}
