import { ReactNode } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TrackerCardProps {
  id: string;
  title: string;
  icon: ReactNode;
  color?: string;
  route: string;
  children: ReactNode;
  onReset?: () => void;
}

export function TrackerCard({ id, title, icon, color, route, children, onReset }: TrackerCardProps) {
  return (
    <Card id={id} className="tracker-card fade-in">
      <CardHeader className="p-6 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            <span className={`text-2xl ${color || 'text-primary'}`}>
              {icon}
            </span>
            <h3 className="text-lg font-semibold mt-1">{title}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={route}>View Details</Link>
              </DropdownMenuItem>
              {onReset && (
                <DropdownMenuItem onClick={onReset}>
                  Reset Data
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-4">
        {children}
      </CardContent>
    </Card>
  );
}
