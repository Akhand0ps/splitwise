import request from './client';

export interface Group {
  id: number;
  name: string;
  description?: string | null;
  memberCount?: number;
  myBalance?: number;
}

export interface GroupDetail extends Group {
  members: Member[];
}

export interface Member {
  id: number;
  name: string;
  email: string;
}

// Raw shape returned by the API for group member entries
interface RawMemberEntry {
  user: Member;
}

// Raw group shape from API (members nested as group.members[].user)
interface RawGroupDetail {
  id: number;
  name: string;
  description?: string | null;
  members: RawMemberEntry[];
}

export function getGroups(): Promise<Group[]> {
  return request<{ groups: Group[] }>('/groups').then((r) => r.groups);
}

export function getGroup(id: string): Promise<GroupDetail> {
  return request<{ group: RawGroupDetail }>(`/groups/${id}`).then((r) => ({
    ...r.group,
    members: r.group.members.map((m) => m.user),
  }));
}

export function createGroup(name: string, description?: string): Promise<Group> {
  return request<{ group: Group }>('/groups', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  }).then((r) => r.group);
}

export function addMember(groupId: string, email: string): Promise<Member> {
  return request<{ member: { user: Member } }>(`/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  }).then((r) => r.member.user);
}
