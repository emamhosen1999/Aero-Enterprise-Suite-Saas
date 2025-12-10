<?php

namespace Aero\HRM\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class LeaveResourceCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        // Keep original Laravel pagination structure but add our own additional data
        return [
            'data' => $this->collection,
            'total' => $this->resource->total(),
            'count' => $this->resource->count(),
            'per_page' => $this->resource->perPage(),
            'current_page' => $this->resource->currentPage(),
            'last_page' => $this->resource->lastPage(),
            'from' => $this->resource->firstItem(),
            'to' => $this->resource->lastItem(),
            'path' => $this->resource->path(),
            'first_page_url' => $this->resource->url(1),
            'last_page_url' => $this->resource->url($this->resource->lastPage()),
            'next_page_url' => $this->resource->nextPageUrl(),
            'prev_page_url' => $this->resource->previousPageUrl(),
            'links' => $this->resource->linkCollection()->toArray(),
        ];
    }
}
