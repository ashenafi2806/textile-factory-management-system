"use client";

import React, { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import workforceService from "@/services/workforceService";
import { useProfilePicture } from "@/context/profile-picture-context";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import toast from "react-hot-toast";

export default function WorkerProfile() {
  const { profilePictureUrl, refreshProfilePicture, setProfilePictureUrl } =
    useProfilePicture();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    let mounted = true;
    workforceService
      .getMe()
      .then((r: any) => {
        if (!mounted) return;
        setProfile(r.data);
        setForm({
          username: r.data.username || "",
          email: r.data.email || "",
          phoneNumber: r.data.workerProfile?.phoneNumber || "",
          emergencyContact: r.data.workerProfile?.emergencyContact || "",
          position: r.data.workerProfile?.position || "",
          skillLevel: r.data.workerProfile?.skillLevel || "",
        });
      })
      .catch((e) => {
        console.error("WorkerProfile: failed to load", e);
      })
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const update = async () => {
    try {
      setIsSaving(true);
      await workforceService.updateMe(form);
      toast.success("Profile updated");
      const r: any = await workforceService.getMe();
      setProfile(r.data);
    } catch (e) {
      console.error("WorkerProfile update failed", e);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      const res = await workforceService.uploadProfilePicture(file);
      const url = res.data?.url as string | undefined;
      if (url) {
        const busted = `${url.split("?")[0]}?t=${Date.now()}`;
        setProfilePictureUrl(busted);
      }
      const refreshed = await refreshProfilePicture();
      const me: any = await workforceService.getMe();
      setProfile({
        ...me.data,
        profilePictureUrl: refreshed ?? me.data?.profilePictureUrl ?? url,
      });
      toast.success("Profile photo updated");
    } catch (e) {
      console.error("Upload failed", e);
      toast.error("Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const avatarUrl = profilePictureUrl ?? profile?.profilePictureUrl ?? null;

  if (loading)
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-44 rounded bg-slate-200" />
          <div className="h-28 rounded-xl bg-slate-100" />
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-12 rounded bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );

  if (!profile)
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-600">
        Profile not available
      </div>
    );

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 sm:flex-row sm:items-center">
        <div className="relative mx-auto sm:mx-0">
          <ProfileAvatar
            src={avatarUrl}
            name={profile.username}
            size="lg"
            className="border-4 border-white shadow-md"
          />
          <label
            className={`absolute bottom-0 right-0 flex cursor-pointer items-center justify-center rounded-full border-2 border-white bg-white p-2 shadow-md transition hover:bg-indigo-50 ${isUploadingPhoto ? "pointer-events-none opacity-60" : ""}`}
            title="Change profile photo"
          >
            <Camera className="h-4 w-4 text-slate-600" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => uploadPhoto(e.target.files?.[0])}
              className="hidden"
              disabled={isUploadingPhoto}
            />
          </label>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-xl font-semibold text-slate-900">
            {profile.username}
          </h3>
          <p className="text-sm text-slate-600">{profile.email}</p>
          <p className="mt-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            {profile.workerProfile?.position || "Worker"}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            {isUploadingPhoto
              ? "Uploading photo..."
              : "Click the camera icon to update your profile picture."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Username
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Phone
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Emergency Contact
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500"
            value={form.emergencyContact}
            onChange={(e) =>
              setForm({ ...form, emergencyContact: e.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Position
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Skill Level
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500"
            value={form.skillLevel}
            onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={update}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
