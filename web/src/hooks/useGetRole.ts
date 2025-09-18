import { useSession } from "next-auth/react";
import { useMemo } from "react";

const Role = ['ADMIN', 'OPERATION_MANAGER', 'PLANNER', 'ACCOUNTANT', 'CUSTOMER']


export const useGetRole = () => {
  const { data: session } = useSession();
  const userRoles: string[] = useMemo(() => (session?.user?.role || []) as string[], [session]);
  return Role.map(role => userRoles.includes(role) ? role : null).filter(Boolean).join(', ') || 'None';
}
