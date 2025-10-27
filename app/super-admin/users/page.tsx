// app/super-admin/users/page.tsx
import UserManagement from "@/components/users/Users";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return <UserManagement themeColor="#954C2E" themeLight="#F5E9E4" />;
}
