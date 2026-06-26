import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <UserButton />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">User ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xs break-all">{userId}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
