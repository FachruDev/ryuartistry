"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createCode, isKnownRedirect, originOf, redirectLabel, validateAuthorizeRequest } from "@/lib/ai/oauth";

const fields = ["client_id", "redirect_uri", "response_type", "code_challenge", "code_challenge_method", "state"] as const;

async function readRequest(form: FormData) {
  const params = Object.fromEntries(fields.map((f) => [f, form.get(f)?.toString()]));
  const result = await validateAuthorizeRequest(params);
  // The page already showed any error; a tampered form just goes back to the CMS.
  if (!("request" in result) || !result.request) redirect("/admin/ai");
  return result.request;
}

function callback(redirectUri: string, values: Record<string, string>) {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(values)) if (value) url.searchParams.set(key, value);
  return url.toString();
}

export async function approveAuthorization(form: FormData) {
  const user = await requireAdmin();
  const request = await readRequest(form);
  // Anyone can register an app under any name, so an unknown destination must be confirmed by typing nothing less than its exact host.
  if (!isKnownRedirect(request.redirectUri) && form.get("acknowledge") !== redirectLabel(request.redirectUri)) {
    const back = new URLSearchParams(Object.fromEntries(fields.map((f) => [f, form.get(f)?.toString() ?? ""])));
    redirect(`/admin/authorize?${back}&confirm=1`);
  }
  const code = await createCode(request, user.id);
  redirect(callback(request.redirectUri, { code, state: request.state, iss: originOf(await headers()) }));
}

export async function denyAuthorization(form: FormData) {
  await requireAdmin();
  const request = await readRequest(form);
  redirect(callback(request.redirectUri, { error: "access_denied", state: request.state, iss: originOf(await headers()) }));
}
