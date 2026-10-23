"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type User = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  accessLevel: string;
};

type UsersResponse = {
  data: User[];
  pagination: { resourceCount: number; totalPages: number; page: number; limit: number };
};

async function getUsers(page: number, limit: number) {
  const response = await fetch(`/api/users?page=${page}&limit=${limit}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load users");
  return response.json() as Promise<UsersResponse>;
}

export function UsersPage() {
  const t = useTranslations("UsersPage");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<keyof User>("accessLevel");
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const addUserFormRef = useRef<HTMLFormElement>(null);
  const usersQuery = useQuery({
    queryKey: ["users", page, limit],
    queryFn: () => getUsers(page, limit),
  });
  const createUser = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: formData.get("username"),
          display_name: formData.get("displayName"),
          user_email: formData.get("email"),
          user_level: formData.get("accessLevel"),
          user_password: formData.get("password"),
        }),
      });
      if (!response.ok) throw new Error("Unable to create user");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      addUserFormRef.current?.reset();
      setFormError(null);
      setIsAdding(false);
    },
    onError: () => setFormError(t("createError")),
  });
  const users = [...(usersQuery.data?.data ?? [])].sort((left, right) =>
    left[sortBy].localeCompare(right[sortBy]),
  );
  const pagination = usersQuery.data?.pagination;

  function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    createUser.mutate(new FormData(event.currentTarget));
  }

  return (
    <div className="min-h-svh bg-[#f7f7f8] text-[#26212a]">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-[#e5e1e6] bg-white px-5 py-3 sm:px-8">
        <h1 className="text-xl font-semibold text-[#221b25]">{t("title")}</h1>
        <label>
          <span className="sr-only">{t("sortBy")}</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as keyof User)} className="h-8 rounded border border-[#d9d4db] bg-white px-2 text-xs text-[#5e5661] outline-none focus:border-[#7b1a89] focus:ring-2 focus:ring-[#7b1a89]/15">
            <option value="accessLevel">{t("sortByAccessLevel")}</option>
            <option value="username">{t("sortByUsername")}</option>
            <option value="displayName">{t("sortByDisplayName")}</option>
          </select>
        </label>
      </header>

      <div className="mx-auto w-full max-w-7xl p-5 sm:p-8">
        <section className="flex flex-wrap items-center justify-between gap-4 border border-[#e2dde3] bg-[#f9f5fa] p-4">
          <div>
            <h2 className="text-sm font-semibold text-[#29232c]">{t("addUserTitle")}</h2>
            <p className="mt-1 text-xs text-[#756b78]">{t("addUserDescription")}</p>
          </div>
          <Button type="button" onClick={() => setIsAdding(true)} className="bg-[#7b1a89] hover:bg-[#671473]">
            <Plus aria-hidden="true" /> {t("addUser")}
          </Button>
        </section>

        <section className="mt-5 overflow-hidden rounded-md border border-[#e2dde3] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-[#f0eef1] text-[#5e5661]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">{t("username")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("displayName")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("email")}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t("accessLevel")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeaf0]">
                {usersQuery.isError ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#9c3b47]">{t("unavailable")}</td></tr>
                ) : usersQuery.isLoading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#756b78]">{t("loading")}</td></tr>
                ) : users.length ? users.map((user) => (
                  <tr key={user.id || user.username} className="text-[#3c3540]">
                    <td className="px-4 py-3 font-medium">{user.username}</td>
                    <td className="px-4 py-3">{user.displayName}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.accessLevel}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#756b78]">{t("noUsers")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eeeaf0] px-4 py-3 text-xs text-[#756b78]">
            <span>{t("showing", { from: users.length ? (page - 1) * limit + 1 : 0, to: (page - 1) * limit + users.length, total: pagination?.resourceCount ?? 0 })}</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label={t("previousPage")}><ChevronLeft /></Button>
              <span>{page} / {pagination?.totalPages ?? 1}</span>
              <Button variant="ghost" size="icon-sm" type="button" disabled={page >= (pagination?.totalPages ?? 1)} onClick={() => setPage((current) => current + 1)} aria-label={t("nextPage")}><ChevronRight /></Button>
              <label className="ml-2 flex items-center gap-2"><span>{t("rowsPerPage")}</span><select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="h-7 rounded border border-[#d9d4db] bg-white px-1"><option value="10">10</option><option value="20">20</option></select></label>
            </div>
          </footer>
        </section>
      </div>

      {isAdding ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5" role="presentation">
          <form ref={addUserFormRef} onSubmit={submitUser} className="w-full max-w-md rounded-md bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="add-user-dialog-title">
            <div className="flex items-start justify-between gap-4"><div><h2 id="add-user-dialog-title" className="text-base font-semibold">{t("addUser")}</h2><p className="mt-1 text-xs text-[#756b78]">{t("addUserDescription")}</p></div><Button type="button" variant="ghost" size="icon-sm" onClick={() => setIsAdding(false)} disabled={createUser.isPending} aria-label={t("closeDialog")}><X /></Button></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-medium">{t("username")}<input required name="username" autoComplete="username" placeholder={t("usernamePlaceholder")} className="h-9 rounded border border-[#d9d4db] px-2 font-normal placeholder:text-[#a49ca6]" /></label>
              <label className="grid gap-1 text-xs font-medium">{t("displayName")}<input required name="displayName" autoComplete="name" placeholder={t("displayNamePlaceholder")} className="h-9 rounded border border-[#d9d4db] px-2 font-normal placeholder:text-[#a49ca6]" /></label>
              <label className="grid gap-1 text-xs font-medium">{t("email")}<input required type="email" name="email" autoComplete="email" placeholder={t("emailPlaceholder")} className="h-9 rounded border border-[#d9d4db] px-2 font-normal placeholder:text-[#a49ca6]" /></label>
              <label className="grid gap-1 text-xs font-medium">{t("password")}<input required type="password" name="password" minLength={8} autoComplete="new-password" placeholder={t("passwordPlaceholder")} className="h-9 rounded border border-[#d9d4db] px-2 font-normal placeholder:text-[#a49ca6]" /></label>
              <label className="grid gap-1 text-xs font-medium sm:col-span-2">{t("accessLevel")}<select required name="accessLevel" defaultValue="" className="h-9 rounded border border-[#d9d4db] bg-white px-2 font-normal"><option value="" disabled>{t("select")}</option><option value="USER">{t("userAccessLevel")}</option><option value="ADMIN">{t("adminAccessLevel")}</option></select></label>
            </div>
            {formError ? <p className="mt-4 text-sm text-[#9c3b47]" role="alert">{formError}</p> : null}
            <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={createUser.isPending}>{t("cancel")}</Button><Button type="submit" disabled={createUser.isPending} className="bg-[#7b1a89] hover:bg-[#671473]">{createUser.isPending ? t("creating") : t("addUser")}</Button></div>
          </form>
        </div>
      ) : null}
    </div>
  );
}