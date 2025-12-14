import React from 'react';
import { Pagination as HeroUIPagination } from '@heroui/react';

const Pagination = ({ 
    currentPage = 1, 
    totalPages = 1, 
    onPageChange, 
    ...props 
}) => {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex justify-center mt-4">
            <HeroUIPagination 
                total={totalPages}
                page={currentPage}
                onChange={onPageChange}
                color="primary"
                variant="bordered"
                showControls
                isCompact
                {...props}
            />
        </div>
    );
};

export default Pagination;
