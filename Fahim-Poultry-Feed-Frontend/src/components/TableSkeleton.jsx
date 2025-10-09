import React from 'react';
import { TableRow, TableCell, Skeleton } from '@mui/material';

const TableSkeleton = ({ columns, rowsNum = 5 }) => {
    return [...Array(rowsNum)].map((_, index) => (
        <TableRow key={index}>
            {[...Array(columns)].map((_, i) => (
                <TableCell key={i}>
                    <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                </TableCell>
            ))}
        </TableRow>
    ));
};

export default TableSkeleton;