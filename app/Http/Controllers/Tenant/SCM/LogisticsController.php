<?php

namespace App\Http\Controllers\SCM;

use App\Http\Controllers\Controller;
use App\Models\InventoryLocation;
use App\Models\LogisticsCarrier;
use App\Models\LogisticsShipment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class LogisticsController extends Controller
{
    public function index()
    {
        return Inertia::render('SCM/Logistics/Index', [
            'shipments' => LogisticsShipment::with(['carrier', 'fromLocation', 'toLocation'])
                ->latest()
                ->paginate(15),
            'carriers' => LogisticsCarrier::where('is_active', true)->get(),
            'stats' => [
                'total_shipments' => LogisticsShipment::count(),
                'in_transit' => LogisticsShipment::where('status', 'in_transit')->count(),
                'delivered' => LogisticsShipment::where('status', 'delivered')->count(),
                'pending' => LogisticsShipment::where('status', 'pending')->count(),
            ],
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('SCM/Logistics/Create', [
            'carriers' => LogisticsCarrier::where('is_active', true)->get(),
            'locations' => InventoryLocation::where('is_active', true)->get(),
            'nextShipmentNumber' => $this->generateShipmentNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'shipment_number' => 'required|string|unique:logistics_shipments,shipment_number',
            'carrier_id' => 'nullable|exists:logistics_carriers,id',
            'tracking_number' => 'nullable|string|max:255',
            'shippable_type' => 'required|string',
            'shippable_id' => 'required|integer',
            'from_location_id' => 'nullable|exists:inventory_locations,id',
            'to_location_id' => 'nullable|exists:inventory_locations,id',
            'shipping_method' => 'nullable|string|max:255',
            'shipping_cost' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'weight_unit' => 'nullable|string|in:kg,lb,g,oz',
            'length' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'dimensions_unit' => 'nullable|string|in:cm,in,mm,m',
            'from_address' => 'nullable|string',
            'to_address' => 'nullable|string',
            'ship_date' => 'nullable|date',
            'estimated_delivery' => 'nullable|date|after_or_equal:ship_date',
            'notes' => 'nullable|string',
        ]);

        LogisticsShipment::create(array_merge($validated, [
            'weight_unit' => $validated['weight_unit'] ?? 'kg',
            'dimensions_unit' => $validated['dimensions_unit'] ?? 'cm',
        ]));

        return Redirect::route('scm.logistics.index')->with('status', 'Shipment created successfully.');
    }

    public function show(LogisticsShipment $logistic)
    {
        $logistic->load(['carrier', 'fromLocation', 'toLocation', 'shippable']);

        return Inertia::render('SCM/Logistics/Show', [
            'shipment' => $logistic,
        ]);
    }

    public function edit(LogisticsShipment $logistic)
    {
        return Inertia::render('SCM/Logistics/Edit', [
            'shipment' => $logistic,
            'carriers' => LogisticsCarrier::where('is_active', true)->get(),
            'locations' => InventoryLocation::where('is_active', true)->get(),
        ]);
    }

    public function update(Request $request, LogisticsShipment $logistic)
    {
        $validated = $request->validate([
            'carrier_id' => 'nullable|exists:logistics_carriers,id',
            'tracking_number' => 'nullable|string|max:255',
            'from_location_id' => 'nullable|exists:inventory_locations,id',
            'to_location_id' => 'nullable|exists:inventory_locations,id',
            'shipping_method' => 'nullable|string|max:255',
            'shipping_cost' => 'nullable|numeric|min:0',
            'weight' => 'nullable|numeric|min:0',
            'weight_unit' => 'nullable|string|in:kg,lb,g,oz',
            'length' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'dimensions_unit' => 'nullable|string|in:cm,in,mm,m',
            'from_address' => 'nullable|string',
            'to_address' => 'nullable|string',
            'ship_date' => 'nullable|date',
            'estimated_delivery' => 'nullable|date|after_or_equal:ship_date',
            'delivered_at' => 'nullable|date',
            'status' => 'required|string|in:pending,processed,shipped,in_transit,delivered,failed,returned',
            'notes' => 'nullable|string',
        ]);

        $logistic->update($validated);

        return Redirect::route('scm.logistics.index')->with('status', 'Shipment updated successfully.');
    }

    public function destroy(LogisticsShipment $logistic)
    {
        // Only allow deletion of pending shipments
        if (! in_array($logistic->status, ['pending', 'failed'])) {
            return Redirect::route('scm.logistics.index')->with('error', 'Only pending or failed shipments can be deleted.');
        }

        $logistic->delete();

        return Redirect::route('scm.logistics.index')->with('status', 'Shipment deleted successfully.');
    }

    public function updateStatus(Request $request, LogisticsShipment $logistic)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,processed,shipped,in_transit,delivered,failed,returned',
            'delivered_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $updateData = [
            'status' => $validated['status'],
            'notes' => $validated['notes'],
        ];

        if ($validated['status'] === 'delivered' && $validated['delivered_at']) {
            $updateData['delivered_at'] = $validated['delivered_at'];
        }

        $logistic->update($updateData);

        return Redirect::back()->with('status', 'Shipment status updated successfully.');
    }

    public function trackShipment(LogisticsShipment $logistic)
    {
        $trackingInfo = [];

        if ($logistic->carrier && $logistic->tracking_number && $logistic->carrier->tracking_url_format) {
            $trackingInfo['url'] = str_replace('{tracking_number}', $logistic->tracking_number, $logistic->carrier->tracking_url_format);
        }

        return Inertia::render('SCM/Logistics/Track', [
            'shipment' => $logistic->load(['carrier', 'fromLocation', 'toLocation']),
            'trackingInfo' => $trackingInfo,
        ]);
    }

    // Carriers Management
    public function carriers()
    {
        return Inertia::render('SCM/Logistics/Carriers', [
            'carriers' => LogisticsCarrier::latest()->paginate(10),
            'status' => session('status'),
        ]);
    }

    public function createCarrier()
    {
        return Inertia::render('SCM/Logistics/CreateCarrier');
    }

    public function storeCarrier(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_info' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'tracking_url_format' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        LogisticsCarrier::create($validated);

        return Redirect::route('scm.logistics.carriers')->with('status', 'Carrier created successfully.');
    }

    public function editCarrier(LogisticsCarrier $carrier)
    {
        return Inertia::render('SCM/Logistics/EditCarrier', [
            'carrier' => $carrier,
        ]);
    }

    public function updateCarrier(Request $request, LogisticsCarrier $carrier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_info' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'tracking_url_format' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $carrier->update($validated);

        return Redirect::route('scm.logistics.carriers')->with('status', 'Carrier updated successfully.');
    }

    public function destroyCarrier(LogisticsCarrier $carrier)
    {
        $carrier->delete();

        return Redirect::route('scm.logistics.carriers')->with('status', 'Carrier deleted successfully.');
    }

    private function generateShipmentNumber()
    {
        $lastShipment = LogisticsShipment::latest('id')->first();
        $nextNumber = $lastShipment ? (int) substr($lastShipment->shipment_number, 4) + 1 : 1;

        return 'SHP-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }
}
