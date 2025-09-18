import React from "react";

type TableColumn<T> = { header: string; accessor: keyof T & string; className?: string };

const Table = <T,>({
  columns,
  renderRow,
  data,
}: {
  columns: TableColumn<T>[];
  renderRow: (item: T) => React.ReactNode;
  data: T[];
}) => {
  return (
    <table className="w-full mt-4">
      <thead>
        <tr className="text-left text-gray-500 text-sm">
          {columns.map((col) => (
            <th key={col.accessor} className={col.className}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>{data.map((item, index) => <React.Fragment key={index}>{renderRow(item)}</React.Fragment>)}</tbody>
    </table>
  );
};

export default Table;