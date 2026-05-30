"use client";
import React, { useEffect, useState } from "react";
import workforceService from "@/services/workforceService";
import toast from "react-hot-toast";

export default function WorkerProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});

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
      await workforceService.updateMe(form);
      toast.success("Profile updated");
      // refresh
      const r: any = await workforceService.getMe();
      setProfile(r.data);
    } catch (e) {
      console.error("WorkerProfile update failed", e);
      toast.error("Failed to update profile");
    }
  };

  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    try {
      const r: any = await workforceService.uploadProfilePicture(file);
      toast.success("Profile photo uploaded");
      // refresh
      const me: any = await workforceService.getMe();
      setProfile(me.data);
    } catch (e) {
      console.error("Upload failed", e);
      toast.error("Failed to upload photo");
    }
  };

  if (loading) return <div className="p-4">Loading profile...</div>;
  if (!profile)
    return <div className="p-4 text-rose-600">Profile not available</div>;

  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <h3 className="text-lg font-medium mb-3">My Profile</h3>
      <div className="mb-4 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100">
          {profile.profilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profilePictureUrl}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-500">
              {profile.username?.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <label className="text-sm block">Profile Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => uploadPhoto(e.target.files?.[0])}
            className="mt-1"
          />
        </div>
      </div>
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        <div>
          <label className="block text-sm">Username</label>
          <input
            className="input mt-1 w-full"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input
            className="input mt-1 w-full"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm">Phone</label>
          <input
            className="input mt-1 w-full"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm">Emergency Contact</label>
          <input
            className="input mt-1 w-full"
            value={form.emergencyContact}
            onChange={(e) =>
              setForm({ ...form, emergencyContact: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm">Position</label>
          <input
            className="input mt-1 w-full"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm">Skill Level</label>
          <input
            className="input mt-1 w-full"
            value={form.skillLevel}
            onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="btn" onClick={update}>
          Save Profile
        </button>
      </div>
    </div>
  );
}
