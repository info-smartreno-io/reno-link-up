import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Download, Loader2 } from "lucide-react";
import { BidLineItem, useBidBuilder } from "@/hooks/contractor/useBidBuilder";

const UNITS = ["SF", "LF", "EA", "HR", "DAY", "ALLOW"];

interface BidBuilderTableProps {
  opportunityId: string;
}

export function BidBuilderTable({ opportunityId }: BidBuilderTableProps) {
  const {
    lineItems,
    exclusions,
    setExclusions,
    proposalText,
    setProposalText,
    estimatedTimeline,
    setEstimatedTimeline,
    costCodes,
    addLineItem,
    removeLineItem,
    updateLineItem,
    populateFromCostCodes,
    totalAmount,
    alternatesTotal,
    saveDraft,
    submitBid,
    isSaving,
    existingSubmission,
  } = useBidBuilder(opportunityId);

  const handleCostCodeSelect = (index: number, costCodeId: string) => {
    const cc = costCodes.find((c) => c.id === costCodeId);
    if (!cc) return;
    updateLineItem(index, "cost_code_id", costCodeId);
    updateLineItem(index, "description", cc.description);
    updateLineItem(index, "unit", cc.unit);
    updateLineItem(index, "unit_price", Number(cc.total_unit_price || 0));
  };

  const baseItems = lineItems.filter((li) => !li.is_alternate);
  const alternateItems = lineItems.filter((li) => li.is_alternate);

  return (
    <div className="space-y-6">
      {/* Existing draft notice */}
      {existingSubmission && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
          <Badge variant={existingSubmission.status === "submitted" ? "default" : "secondary"}>
            {existingSubmission.status === "submitted" ? "Submitted" : "Draft"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {existingSubmission.status === "submitted"
              ? "You have already submitted a bid. You can update it below."
              : "You have a saved draft. Continue editing below."}
          </span>
        </div>
      )}

      {/* Auto-populate button */}
      {costCodes.length > 0 && lineItems.length === 0 && (
        <Button variant="outline" onClick={populateFromCostCodes}>
          <Download className="h-4 w-4 mr-2" />
          Auto-fill from My Cost Codes ({costCodes.length} items)
        </Button>
      )}

      {/* Base Line Items */}
      <div>
        <h3 className="font-semibold mb-2">Line Items</h3>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Cost Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[90px]">Unit</TableHead>
                <TableHead className="w-[90px]">Qty</TableHead>
                <TableHead className="w-[110px]">Unit Price</TableHead>
                <TableHead className="w-[110px]">Total</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item, index) => {
                if (item.is_alternate) return null;
                return (
                  <TableRow key={index}>
                    <TableCell>
                      {costCodes.length > 0 ? (
                        <Select
                          value={item.cost_code_id || ""}
                          onValueChange={(v) => handleCostCodeSelect(index, v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {costCodes.map((cc) => (
                              <SelectItem key={cc.id} value={cc.id}>
                                {cc.code} — {cc.description?.slice(0, 30)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(index, "description", e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Description"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.unit}
                        onValueChange={(v) => updateLineItem(index, "unit", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))}
                        className="h-8 text-sm"
                        min={0}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(index, "unit_price", Number(e.target.value))}
                        className="h-8 text-sm"
                        min={0}
                        step={0.01}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      ${(item.quantity * item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeLineItem(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-3">
          <Button variant="outline" size="sm" onClick={addLineItem}>
            <Plus className="h-4 w-4 mr-1" /> Add Line Item
          </Button>
          <div className="text-right">
            <span className="text-sm text-muted-foreground mr-2">Base Total:</span>
            <span className="text-lg font-bold">
              ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Alternates */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Alternates</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newItem: BidLineItem = {
                cost_code_id: null,
                description: "",
                unit: "EA",
                quantity: 1,
                unit_price: 0,
                is_alternate: true,
                sort_order: lineItems.length,
              };
              // We need to add it differently
              const idx = lineItems.length;
              addLineItem();
              // After adding, mark it as alternate
              setTimeout(() => updateLineItem(idx, "is_alternate", true), 0);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Alternate
          </Button>
        </div>
        {alternateItems.length > 0 && (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[90px]">Unit</TableHead>
                  <TableHead className="w-[90px]">Qty</TableHead>
                  <TableHead className="w-[110px]">Unit Price</TableHead>
                  <TableHead className="w-[110px]">Total</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => {
                  if (!item.is_alternate) return null;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(index, "description", e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Alternate description"
                        />
                      </TableCell>
                      <TableCell>
                        <Select value={item.unit} onValueChange={(v) => updateLineItem(index, "unit", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.quantity} onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))} className="h-8 text-sm" min={0} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.unit_price} onChange={(e) => updateLineItem(index, "unit_price", Number(e.target.value))} className="h-8 text-sm" min={0} step={0.01} />
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        ${(item.quantity * item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLineItem(index)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {alternatesTotal > 0 && (
          <div className="text-right mt-2">
            <span className="text-sm text-muted-foreground mr-2">Alternates Total:</span>
            <span className="font-semibold">${alternatesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>

      {/* Exclusions */}
      <div>
        <h3 className="font-semibold mb-2">Exclusions</h3>
        <Textarea
          value={exclusions}
          onChange={(e) => setExclusions(e.target.value)}
          placeholder="List any exclusions from your bid..."
          rows={3}
        />
      </div>

      {/* Proposal & Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Proposal Notes</h3>
          <Textarea
            value={proposalText}
            onChange={(e) => setProposalText(e.target.value)}
            placeholder="Additional notes about your bid..."
            rows={3}
          />
        </div>
        <div>
          <h3 className="font-semibold mb-2">Estimated Timeline</h3>
          <Input
            value={estimatedTimeline}
            onChange={(e) => setEstimatedTimeline(e.target.value)}
            placeholder="e.g. 8-10 weeks"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <span className="text-sm text-muted-foreground">Total Bid Amount: </span>
          <span className="text-2xl font-bold">
            ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={saveDraft} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Draft
          </Button>
          <Button onClick={submitBid} disabled={isSaving || lineItems.length === 0}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Bid
          </Button>
        </div>
      </div>
    </div>
  );
}
