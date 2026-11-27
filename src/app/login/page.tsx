import { redirect } from "next/navigation";

export default async function LoginRedirect({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const resolved = await searchParams;
  if (resolved?.redirect) {
    redirect(`/tenant?redirect=${encodeURIComponent(resolved.redirect)}`);
  }
  redirect("/tenant");
}
