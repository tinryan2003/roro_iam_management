import React from "react";

type TableColumn = { header: string; accessor: string; className?: string };

type TableProps<T> = {
  columns: TableColumn[];
  renderRow: (item: T) => React.ReactNode;
  data: T[];
};

const Table = <T,>({ columns, renderRow, data }: TableProps<T>) => {
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