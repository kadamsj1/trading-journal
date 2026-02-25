'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tradesApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Edit,
  XCircle,
  Calendar,
  Zap,
  BadgeDollarSign,
  TrendingUp,
  TrendingDown,
  Image as ImageIcon,
  Tag,
  FileText,
  Clock,
  ExternalLink,
  Target,
  Plus,
  UploadCloud
} from 'lucide-react';
import { format } from 'date-fns';
import { formatINR } from '@/lib/currency';
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';

interface Trade {
  id: number;
  symbol: string;
  trade_type: string;
  status: string;
  entry_price: number;
  entry_date: string;
  exit_price: number | null;
  exit_date: string | null;
  quantity: number;
  profit_loss: number | null;
  profit_loss_percentage: number | null;
  notes: string | null;
  tags: string | null;
  emotion: string | null;
  screenshot_path: string | null;
}

export default function TradeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = parseInt(params.id as string);
  const tradeId = parseInt(params.tradeId as string);

  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeData, setCloseData] = useState({
    exit_price: '',
    exit_date: new Date().toISOString().split('T')[0],
  });
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    symbol: '',
    trade_type: 'long',
    entry_price: '',
    entry_date: '',
    quantity: '',
    notes: '',
    tags: '',
    emotion: '',
    exit_price: '',
    exit_date: '',
    status: 'open'
  });

  useEffect(() => {
    fetchTrade();
  }, [tradeId]);

  const fetchTrade = async () => {
    try {
      const response = await tradesApi.getById(tradeId);
      const data = response.data;
      setTrade(data);

      setEditData({
        symbol: data.symbol,
        trade_type: data.trade_type,
        entry_price: data.entry_price.toString(),
        entry_date: new Date(data.entry_date).toISOString().split('T')[0],
        quantity: data.quantity.toString(),
        notes: data.notes || '',
        tags: data.tags || '',
        emotion: data.emotion || '',
        exit_price: data.exit_price?.toString() || '',
        exit_date: data.exit_date ? new Date(data.exit_date).toISOString().split('T')[0] : '',
        status: data.status
      });
    } catch (error) {
      console.error('Failed to fetch trade:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTrade = async () => {
    try {
      await tradesApi.close(tradeId, {
        exit_price: parseFloat(closeData.exit_price),
        exit_date: new Date(closeData.exit_date).toISOString(),
      });
      setShowCloseDialog(false);
      fetchTrade();
      toast({
        title: "Trade closed",
        description: "Operation finalized successfully.",
      });
    } catch (error) {
      console.error('Failed to close trade:', error);
      toast({
        variant: "destructive",
        title: "Operation failed",
        description: "Verify exit parameters and retry.",
      });
    }
  };

  const handleUpdateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatePayload: any = {
        symbol: editData.symbol.toUpperCase(),
        trade_type: editData.trade_type,
        entry_price: parseFloat(editData.entry_price),
        entry_date: new Date(editData.entry_date).toISOString(),
        quantity: parseFloat(editData.quantity),
        notes: editData.notes || null,
        tags: editData.tags || null,
        emotion: editData.emotion || null,
        status: editData.status
      };

      if (editData.exit_price) {
        updatePayload.exit_price = parseFloat(editData.exit_price);
      } else {
        updatePayload.exit_price = null;
      }

      if (editData.exit_date) {
        updatePayload.exit_date = new Date(editData.exit_date).toISOString();
      } else {
        updatePayload.exit_date = null;
      }

      await tradesApi.update(tradeId, updatePayload);
      setShowEditDialog(false);
      fetchTrade();
      toast({
        title: "Vault updated",
        description: "Trade parameters modified successfully.",
      });
    } catch (error) {
      console.error('Failed to update trade:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Operation aborted due to technical error.",
      });
    }
  };

  const handleUploadScreenshot = async () => {
    if (!file) return;

    try {
      await tradesApi.uploadScreenshot(tradeId, file);
      fetchTrade();
      setFile(null);
      toast({
        title: "Visual attached",
        description: "Chart screenshot linked to trade log.",
      });
    } catch (error) {
      console.error('Failed to upload screenshot:', error);
      const errorMsg = (error as any)?.response?.data?.detail || "File processing error.";
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: errorMsg,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      toast({
        title: "File dropped",
        description: `Selected ${droppedFile.name} for upload.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please drop an image file.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground font-medium animate-pulse">Retrieving Execution Log...</p>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 px-4 text-center">
        <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <XCircle className="h-8 w-8 text-red-500 opacity-20" />
        </div>
        <h3 className="text-xl font-black mb-1">Execution Index Failure</h3>
        <p className="text-sm text-muted-foreground font-medium">
          The requested trade ID does not exist in the active vault.
        </p>
        <Button variant="ghost" className="mt-6 font-bold" onClick={() => router.back()}>Return to Vault</Button>
      </div>
    );
  }

  const isProfitable = (trade.profit_loss || 0) >= 0;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Dynamic Header Area */}
      <div className="flex flex-col gap-8 md:flex-row md:items-center justify-between">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-2xl h-14 w-14 border bg-card shadow-sm hover:scale-110 transition-transform"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${trade.status === 'open' ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
                Order: {trade.status}
              </span>
              <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${trade.trade_type === 'long' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                Type: {trade.trade_type}
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase">{trade.symbol} <span className="text-muted-foreground opacity-30 italic font-medium text-4xl">/ EXEC_LOG</span></h1>
          </div>
        </div>

        <div className="flex bg-card p-2 rounded-[1.5rem] border shadow-sm gap-2">
          <Button variant="ghost" onClick={() => setShowEditDialog(true)} className="rounded-xl font-bold gap-2">
            <Edit className="h-4 w-4" /> Edit Parameters
          </Button>
          {trade.status === 'open' && (
            <Button onClick={() => setShowCloseDialog(true)} className="rounded-xl font-black bg-primary">
              Finalize Order
            </Button>
          )}
        </div>
      </div>

      {/* P&L Snapshot Card (Only if closed) */}
      {trade.status === 'closed' && (
        <Card className={`border-none shadow-2xl rounded-[2.5rem] overflow-hidden ${isProfitable ? 'bg-green-500' : 'bg-red-500'}`}>
          <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Realized Performance</p>
              <h2 className="text-6xl font-black tracking-tighter">
                {isProfitable ? '+' : ''}{formatINR(trade.profit_loss || 0)}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="px-6 py-2 bg-white/20 rounded-full backdrop-blur-md">
                <span className="text-2xl font-black">{trade.profit_loss_percentage?.toFixed(2)}% ROI</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Verified Execution</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Grid */}
      <div className="grid gap-8 md:grid-cols-3">
        {/* Entry & Exit Details */}
        <div className="md:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-muted/30 border-b p-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4 rotate-180 text-primary" /> Entry Data
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <DataRow label="Execution Price" value={formatINR(trade.entry_price)} icon={<BadgeDollarSign className="h-4 w-4" />} />
                <DataRow label="Time Stamp" value={format(new Date(trade.entry_date), 'MMMM d, yyyy')} icon={<Calendar className="h-4 w-4" />} />
                <DataRow label="Contract Size" value={`${trade.quantity} Units`} icon={<TrendingUp className="h-4 w-4" />} />
                <div className="pt-4 border-t">
                  <DataRow label="Depl. Capital" value={formatINR(trade.entry_price * trade.quantity)} bold />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-muted/30 border-b p-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-primary" /> Exit Data
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {trade.exit_price ? (
                  <>
                    <DataRow label="Settlement Price" value={formatINR(trade.exit_price)} icon={<BadgeDollarSign className="h-4 w-4" />} />
                    <DataRow label="Settlement Date" value={format(new Date(trade.exit_date!), 'MMMM d, yyyy')} icon={<Clock className="h-4 w-4" />} />
                    <DataRow label="Status" value="FINALIZED" bold color="text-green-500" />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                    <Clock className="h-10 w-10 mb-2 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Exit Command</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Screenshots section */}
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/30 border-b p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black flex items-center gap-3">
                  <ImageIcon className="h-6 w-6 text-primary" />
                  Technical Visuals
                </CardTitle>
                <CardDescription className="font-medium">Attached chart analysis or trade setup proof.</CardDescription>
              </div>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="screenshot-upload"
                />
                <Label
                  htmlFor="screenshot-upload"
                  className="h-12 px-6 rounded-xl border-2 border-dashed border-primary/40 hover:bg-primary/5 flex items-center justify-center cursor-pointer font-bold text-xs gap-2 transition-all"
                >
                  <Plus className="h-4 w-4" /> Link Media
                </Label>
              </div>
            </CardHeader>
            <CardContent
              className={cn(
                "p-10 transition-all duration-300 relative",
                isDragging ? "bg-primary/5 ring-4 ring-primary/40 ring-inset" : ""
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragging && (
                <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-[2px] flex flex-col items-center justify-center border-4 border-dashed border-primary animate-in fade-in duration-200">
                  <UploadCloud className="h-16 w-16 text-primary mb-4 animate-bounce" />
                  <p className="text-xl font-black text-primary uppercase tracking-widest">Drop Screenshot Here</p>
                </div>
              )}
              {trade.screenshot_path ? (
                <div className="relative aspect-video rounded-3xl overflow-hidden border-4 border-muted group">
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <Button variant="secondary" className="font-bold rounded-xl h-12">
                      <ExternalLink className="h-4 w-4 mr-2" /> View Full Resolution
                    </Button>
                  </div>
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8001'}/api/uploads/screenshots/${trade.screenshot_path}`}
                    alt="Trade Screenshot"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border-2 border-dashed rounded-3xl opacity-50">
                  <ImageIcon className="h-12 w-12 mb-4" />
                  <p className="font-black text-xs uppercase tracking-widest">No Visual Assets Linked</p>
                  <p className="text-[10px] mt-2 font-bold max-w-[200px] text-center">Charts provide essential context for trade reviews.</p>
                </div>
              )}

              {file && (
                <div className="mt-8 p-4 bg-primary/5 border-2 border-primary/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <ImageIcon className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-xs font-black truncate max-w-[200px]">{file.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Ready for transmission</p>
                    </div>
                  </div>
                  <Button onClick={handleUploadScreenshot} className="font-black rounded-xl">Transmit File</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Meta Information Sidebar */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="bg-muted/20 pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" /> Tags / Context
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-8 pb-8">
              <div className="flex flex-wrap gap-2">
                {trade.tags ? trade.tags.split(',').map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-black uppercase tracking-tighter border border-primary/10">
                    {tag.trim()}
                  </span>
                )) : (
                  <span className="text-xs font-bold text-muted-foreground italic">No tags associated.</span>
                )}
              </div>
              {trade.emotion && (
                <div className="mt-4 pt-4 border-t border-primary/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Psychological State</p>
                  <div className="px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl text-xs font-black text-primary">
                    {trade.emotion}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="bg-muted/20 pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Strategy Journal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-8 pb-8">
              <p className="text-sm font-medium leading-relaxed opacity-80 whitespace-pre-wrap">
                {trade.notes || 'No strategic observations recorded for this trade execution. Maintaining a journal is critical for performance improvement.'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-indigo-500 to-primary p-8 text-white relative overflow-hidden group">
            <Zap className="absolute -right-4 -bottom-4 h-32 w-32 opacity-20 group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10 space-y-4">
              <h4 className="text-xl font-black leading-tight">Post-Trade Review</h4>
              <p className="text-[11px] font-bold opacity-80 leading-relaxed uppercase tracking-widest">
                Automated behavioral insights will be updated in your main analytics dashboard after verification.
              </p>
              <Button variant="secondary" className="w-full rounded-xl font-black h-12" onClick={() => router.push('/dashboard/analytics')}>
                Check AI Analytics
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Dialogs - Modularized styled components would be better but for now replacing content */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-10">
          <DialogHeader className="space-y-4">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Finalize Command</DialogTitle>
            <DialogDescription className="font-medium">Enter the verified exit parameters to archive this trade.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-8">
            <div className="space-y-3">
              <Label htmlFor="exit_price" className="text-[10px] font-black uppercase tracking-widest">Settlement Price</Label>
              <Input
                id="exit_price"
                type="number"
                step="0.01"
                value={closeData.exit_price}
                onChange={(e) => setCloseData({ ...closeData, exit_price: e.target.value })}
                className="h-14 rounded-2xl border-2 bg-muted/20 font-black text-xl px-6"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="exit_date" className="text-[10px] font-black uppercase tracking-widest">Settlement Date</Label>
              <Input
                id="exit_date"
                type="date"
                value={closeData.exit_date}
                onChange={(e) => setCloseData({ ...closeData, exit_date: e.target.value })}
                className="h-14 rounded-2xl border-2 bg-muted/20 font-black px-6"
                required
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={() => setShowCloseDialog(false)} className="h-14 rounded-2xl border-2 flex-1 font-bold">
              Abort
            </Button>
            <Button onClick={handleCloseTrade} className="h-14 rounded-2xl flex-1 font-black bg-primary shadow-xl shadow-primary/20">
              Commit Settlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl rounded-[2.5rem] p-10 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Edit className="h-6 w-6 text-primary" />
              Modify Parameters
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground/60">Update the core attributes for execution ID: {tradeId}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTrade} className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="edit_symbol" className="text-[10px] font-black uppercase tracking-widest">Asset Symbol</Label>
                <Input
                  id="edit_symbol"
                  value={editData.symbol}
                  onChange={(e) => setEditData({ ...editData, symbol: e.target.value })}
                  className="h-12 rounded-xl border-2 bg-muted/20 font-black uppercase"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_trade_type" className="text-[10px] font-black uppercase tracking-widest">Type</Label>
                <select
                  id="edit_trade_type"
                  value={editData.trade_type}
                  onChange={(e) => setEditData({ ...editData, trade_type: e.target.value })}
                  className="flex h-12 w-full rounded-xl border-2 border-input bg-muted/20 px-4 py-2 text-sm font-black uppercase"
                  required
                >
                  <option value="long">LONG</option>
                  <option value="short">SHORT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="edit_entry_price" className="text-[10px] font-black uppercase tracking-widest">Entry Price</Label>
                <Input
                  id="edit_entry_price"
                  type="number"
                  step="0.01"
                  value={editData.entry_price}
                  onChange={(e) => setEditData({ ...editData, entry_price: e.target.value })}
                  className="h-12 rounded-xl border-2 bg-muted/20 font-black"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_quantity" className="text-[10px] font-black uppercase tracking-widest">Size</Label>
                <Input
                  id="edit_quantity"
                  type="number"
                  step="0.01"
                  value={editData.quantity}
                  onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                  className="h-12 rounded-xl border-2 bg-muted/20 font-black"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="edit_entry_date" className="text-[10px] font-black uppercase tracking-widest">Entry Date</Label>
                <Input
                  id="edit_entry_date"
                  type="date"
                  value={editData.entry_date}
                  onChange={(e) => setEditData({ ...editData, entry_date: e.target.value })}
                  className="h-12 rounded-xl border-2 bg-muted/20 font-black"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status" className="text-[10px] font-black uppercase tracking-widest">Current Status</Label>
                <select
                  id="edit_status"
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                  className="flex h-12 w-full rounded-xl border-2 border-input bg-muted/20 px-4 py-2 text-sm font-black uppercase"
                  required
                >
                  <option value="open">ACTIVE / OPEN</option>
                  <option value="closed">ARCHIVED / CLOSED</option>
                </select>
              </div>
            </div>

            {editData.status === 'closed' && (
              <div className="grid grid-cols-2 gap-6 border-t pt-6 bg-muted/10 p-4 rounded-2xl border-2 border-dashed">
                <div className="space-y-2">
                  <Label htmlFor="edit_exit_price" className="text-[10px] font-black uppercase tracking-widest text-primary">Settlement Price</Label>
                  <Input
                    id="edit_exit_price"
                    type="number"
                    step="0.01"
                    value={editData.exit_price}
                    onChange={(e) => setEditData({ ...editData, exit_price: e.target.value })}
                    className="h-12 rounded-xl border-2 bg-background border-primary/20 font-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_exit_date" className="text-[10px] font-black uppercase tracking-widest text-primary">Settlement Date</Label>
                  <Input
                    id="edit_exit_date"
                    type="date"
                    value={editData.exit_date}
                    onChange={(e) => setEditData({ ...editData, exit_date: e.target.value })}
                    className="h-12 rounded-xl border-2 bg-background border-primary/20 font-black"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit_tags" className="text-[10px] font-black uppercase tracking-widest">Asset Metadata (Tags)</Label>
              <Input
                id="edit_tags"
                value={editData.tags}
                onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                className="h-12 rounded-xl border-2 bg-muted/20 font-bold"
                placeholder="Comma separated tags..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_emotion" className="text-[10px] font-black uppercase tracking-widest">Psychology / Emotion</Label>
              <select
                id="edit_emotion"
                value={editData.emotion}
                onChange={(e) => setEditData({ ...editData, emotion: e.target.value })}
                className="flex h-12 w-full rounded-xl border-2 border-input bg-muted/20 px-4 py-2 text-sm font-black uppercase"
              >
                <option value="Planned Trade">Planned Trade</option>
                <option value="FOMO">FOMO (Fear Of Missing Out)</option>
                <option value="Revenge Trade">Revenge Trade</option>
                <option value="Emotional Entry">Emotional Entry</option>
                <option value="Fat Finger">Fat Finger / Oops</option>
                <option value="Late Entry">Late Entry</option>
                <option value="Overtrading">Overtrading</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_notes" className="text-[10px] font-black uppercase tracking-widest">Strategic Observations</Label>
              <textarea
                id="edit_notes"
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                className="flex min-h-[120px] w-full rounded-xl border-2 bg-muted/20 p-4 text-xs font-medium focus:bg-background outline-none transition-all resize-none"
              />
            </div>

            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="h-14 flex-1 rounded-2xl border-2 font-bold">
                Discard
              </Button>
              <Button type="submit" className="h-14 flex-1 rounded-2xl font-black bg-primary">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DataRow({ label, value, icon, bold = false, color = 'text-foreground' }: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2">
        {icon && <span className="opacity-40 group-hover:opacity-100 transition-opacity">{icon}</span>}
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <span className={`text-sm ${bold ? 'font-black' : 'font-bold'} ${color} tracking-tight`}>{value}</span>
    </div>
  );
}
