import { toast } from "@/hooks/use-toast";

// Demo action handlers that show feedback without making real database changes

export const showDemoToast = (action: string) => {
  toast({
    title: "Demo Mode",
    description: `In the real portal, this would ${action}. Create an account to get started!`,
  });
};

export const handleDemoAddExpense = () => {
  showDemoToast("save your expense");
  return { success: true, id: `demo-exp-${Date.now()}` };
};

export const handleDemoCreateProject = () => {
  showDemoToast("create your project");
  return { success: true, id: `demo-proj-${Date.now()}` };
};

export const handleDemoSubmitBid = () => {
  showDemoToast("submit your bid");
  return { success: true, id: `demo-bid-${Date.now()}` };
};

export const handleDemoSendMessage = () => {
  showDemoToast("send your message");
  return { success: true, id: `demo-msg-${Date.now()}` };
};

export const handleDemoUploadReceipt = () => {
  showDemoToast("upload your receipt");
  return { success: true, url: "demo-receipt-url" };
};

export const handleDemoUpdateProfile = () => {
  showDemoToast("update your profile");
  return { success: true };
};

export const handleDemoScheduleEvent = () => {
  showDemoToast("schedule your event");
  return { success: true, id: `demo-event-${Date.now()}` };
};

export const handleDemoAction = (actionDescription: string) => {
  showDemoToast(actionDescription);
  return { success: true };
};
