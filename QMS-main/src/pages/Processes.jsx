import React from "react";
import { processes } from "../data/mockData";
import PageIntro from "../components/common/PageIntro";
import ProcessTable from "../components/tables/ProcessTable";

export default function Processes() { return <><PageIntro eyebrow="Process register" title="Processes" description="Monitor process ownership and operating performance." /><section className="panel"><ProcessTable items={processes} /></section></>; }
