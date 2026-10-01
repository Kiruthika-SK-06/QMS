import React from "react";
import { useApp } from "../context/AppContext";
import { roles } from "../data/mockData";
import PageIntro from "../components/common/PageIntro";
import Detail from "../components/common/Detail";
import StatusBadge from "../components/common/StatusBadge";

export default function Profile() { const { currentUser } = useApp(); return <><PageIntro eyebrow="Account" title="Profile" description="Your QMS workspace identity and access role." /><section className="panel profile-card"><div className="large-avatar">{currentUser.initials}</div><div><h2>{currentUser.name}</h2><p>{currentUser.email}</p><StatusBadge status={roles[currentUser.role]} /></div><div className="detail-list"><Detail label="User ID" value={currentUser.id} /><Detail label="Role" value={roles[currentUser.role]} /><Detail label="Access model" value="Role-based QMS access" /></div></section></>; }
