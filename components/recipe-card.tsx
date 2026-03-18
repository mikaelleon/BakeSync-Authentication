"use client"

import { memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Edit, Trash2 } from "lucide-react"
import type { Recipe } from "@/lib/types"
import Link from "next/link"

interface RecipeCardProps {
  recipe: Recipe
  canEdit: boolean
  onDelete?: (id: string) => void
  slug?: string
}

export const RecipeCard = memo(function RecipeCard({ recipe, canEdit, onDelete, slug = 'demo' }: RecipeCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{recipe.name}</CardTitle>
            <CardDescription className="mt-1">
              Yield: {recipe.yield} {recipe.yieldUnit}
            </CardDescription>
            {/* Display category */}
            <div className="flex flex-wrap gap-1 mt-2">
              {recipe.category && (
                <Badge variant="outline" className="text-xs">
                  {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
                </Badge>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="ml-2">
            {recipe.ingredients.length} ingredients
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
            <Link href={`/${slug}/recipes/${recipe.id}`}>
              <BookOpen className="h-4 w-4 mr-2" />
              View Recipe
            </Link>
          </Button>
          {canEdit && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${slug}/recipes/${recipe.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete?.(recipe.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
