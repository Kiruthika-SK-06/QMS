import React from "react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import StatusBadge from "../components/common/StatusBadge";

export default function Employees() {
  const { employees } = useApp();

  return (
    <>
      <PageIntro
        eyebrow="People directory"
        title="Employees"
        description="Employees mapped to their assigned QMS processes."
      />
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Process</th>
                <th>Assigned tasks</th>
                <th>Completed</th>
                <th>Pending</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    {item.designation && <small>{item.designation}</small>}
                  </td>
                  <td>{item.id}</td>
                  <td>{item.process}</td>
                  <td>{item.assigned}</td>
                  <td>{item.completed}</td>
                  <td>{item.pending}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
