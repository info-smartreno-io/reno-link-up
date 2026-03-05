import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
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
  Receipt,
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

interface MobileExpenseCardProps {
  expense: Expense;
  onClick?: (expense: Expense) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Materials': <Package className="h-5 w-5" />,
  'Labor': <HardHat className="h-5 w-5" />,
  'Equipment': <Wrench className="h-5 w-5" />,
  'Travel': <Car className="h-5 w-5" />,
  'Fuel': <Fuel className="h-5 w-5" />,
  'Meals': <UtensilsCrossed className="h-5 w-5" />,
  'Office Supplies': <Paperclip className="h-5 w-5" />,
  'Subcontractor': <Users className="h-5 w-5" />,
  'Permits & Fees': <FileText className="h-5 w-5" />,
  'Insurance': <Shield className="h-5 w-5" />,
  'Utilities': <Zap className="h-5 w-5" />,
  'Other': <MoreHorizontal className="h-5 w-5" />,
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

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  reimbursed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export function MobileExpenseCard({ expense, onClick }: MobileExpenseCardProps) {
  const categoryIcon = categoryIcons[expense.category_name] || categoryIcons['Other'];
  const categoryColor = categoryColors[expense.category_name] || categoryColors['Other'];
  const statusColor = statusColors[expense.status] || statusColors['pending'];

  return (
    <Card 
      className="active:scale-[0.98] transition-transform cursor-pointer"
      onClick={() => onClick?.(expense)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("p-2.5 rounded-xl shrink-0", categoryColor)}>
            {categoryIcon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-base truncate">{expense.description}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {expense.category_name}
                </p>
              </div>
              <p className="font-bold text-lg shrink-0">
                ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{format(new Date(expense.expense_date), "MMM d, yyyy")}</span>
                {expense.vendor && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[100px]">{expense.vendor}</span>
                  </>
                )}
                {expense.receipt_file_path && (
                  <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <Badge className={cn("text-xs capitalize", statusColor)} variant="secondary">
                {expense.status}
              </Badge>
            </div>
            
            {expense.contractor_projects?.project_name && (
              <p className="text-xs text-muted-foreground mt-2 truncate flex items-center gap-1">
                <FolderOpen className="h-3 w-3 inline" />
                {expense.contractor_projects.project_name}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}