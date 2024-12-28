import { ProfileManager } from '@/services/profile-manager';

export default async function Page() {
  const profile = await ProfileManager.getProfile();

  return (
    <section className='flex flex-col items-center justify-center h-full p-4 space-y-4'>
      <h2>Welcome to Admin {profile.name}!</h2>

      <h3>Admin home page??</h3>
    </section>
  );
}
