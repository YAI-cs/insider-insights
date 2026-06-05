import { ProfileSettings } from "@/components/profile/profile-settings"
import { verifySession } from "@/lib/dal"

export default async function ProfilePage() {
  await verifySession()
  return <ProfileSettings />
}
