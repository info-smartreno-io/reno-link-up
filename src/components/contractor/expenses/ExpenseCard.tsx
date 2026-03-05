import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Receipt, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Package,
  HardHat,
  Wrench,
  Car,
  Fuel,
  UtensilsCrossed,
  Paperclip,
  Users,
  FileText,
  Shield,
  Zap,
  MoreHorizontal,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  category_name: string;
  vendor?: string;
  status: string;
  receipt_file_path?: string;
  project_id?: string;
  contractor_projects?: {
    project_name?: string;
  };
}

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onViewReceipt?: (path: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Materials': <Package className="h-4 w-4" />,
  'Labor': <HardHat className="h-4 w-4" />,
  'Equipment': <Wrench className="h-4 w-4" />,
  'Travel': <Car className="h-4 w-4" />,
  'Fuel': <Fuel className="h-4 w-4" />,
  'Meals': <UtensilsCrossed className="h-4 w-4" />,
  'Office Supplies': <Paperclip className="h-4 w-4" />,
  'Subcontractor': <Users className="h-4 w-4" />,
  'Permits & Fees': <FileText className="h-4 w-4" />,
  'Insurance': <Shield className="h-4 w-4" />,
  'Utilities': <Zap className="h-4 w-4" />,
  'Other': <MoreHorizontal className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  'Materials': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Labor': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Equipment': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Travel': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Fuel': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Meals': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Office Supplies': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  'Subcontractor': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Permits & Fees': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Insurance': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Utilities': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Other': 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  reimbursed: "outline",
};

export function ExpenseCard({
  expense,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onViewReceipt,
}: ExpenseCardProps) {
  const categoryIcon = categoryIcons[expense.category_name] || categoryIcons['Other'];
  const categoryColor = categoryColors[expense.category_name] || categoryColors['Other'];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn("p-2 rounded-lg shrink-0", categoryColor)}>
              {categoryIcon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{expense.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {expense.vendor && `${expense.vendor} • `}
                {format(new Date(expense.expense_date), "MMM d, yyyy")}
              </p>
              {expense.contractor_projects?.project_name && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                  <FolderOpen className="h-3 w-3 inline" />
                  {expense.contractor_projects.project_name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <p className="font-semibold text-sm">
                ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <Badge variant={statusVariants[expense.status]} className="text-xs capitalize mt-1">
                {expense.status}
              </Badge>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {expense.receipt_file_path && (
                  <DropdownMenuItem onClick={() => onViewReceipt?.(expense.receipt_file_path!)}>
                    <Receipt className="h-4 w-4 mr-2" />
                    View Receipt
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(expense)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {expense.status === 'pending' && onApprove && (
                  <DropdownMenuItem onClick={() => onApprove(expense.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </DropdownMenuItem>
                )}
                {expense.status === 'pending' && onReject && (
                  <DropdownMenuItem onClick={() => onReject(expense.id)}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(expense.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}